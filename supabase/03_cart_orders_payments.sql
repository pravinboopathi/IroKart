-- ============================================================
-- FILE 3: CART, ORDERS & PAYMENTS
-- IT E-Commerce Platform - Supabase Schema
-- ============================================================
-- Run this THIRD (after 02_products_and_inventory.sql)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status_enum AS ENUM (
  'pending',          -- Just placed, awaiting payment
  'confirmed',        -- Payment received
  'processing',       -- Being packed / license being issued
  'shipped',          -- Physical: dispatched
  'out_for_delivery', -- Physical: with delivery agent
  'delivered',        -- Physical: delivered / Digital: sent
  'cancelled',        -- Cancelled before fulfillment
  'return_requested', -- Buyer raised return
  'returned',         -- Return completed
  'refunded'          -- Money returned
);

CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'initiated',
  'captured',     -- Payment success
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE order_type_enum AS ENUM (
  'individual',       -- Normal single purchase
  'bulk_company',     -- Company bulk order with discount
  'wholesale',        -- Wholesaler internal order
  'subscription'      -- Digital subscription renewal
);

CREATE TYPE item_fulfillment_enum AS ENUM (
  'pending',
  'processing',
  'fulfilled',   -- Physical: shipped / Digital: key sent
  'cancelled',
  'returned'
);

CREATE TYPE coupon_type_enum AS ENUM (
  'percentage',
  'fixed_amount',
  'free_shipping'
);

-- ============================================================
-- TABLE: carts
-- One active cart per user (session-based)
-- ============================================================
CREATE TABLE public.carts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id  (1 user : 1 active cart; UNIQUE enforced)
  -- NULL means guest cart (future feature)

  session_id    TEXT,              -- For guest cart sessions (future)
  coupon_code   TEXT,              -- Applied coupon code (validated at checkout)

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_profile_id ON public.carts(profile_id);

-- ============================================================
-- TABLE: cart_items
-- Individual products added to a cart
-- ============================================================
CREATE TABLE public.cart_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id         UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  -- FK → carts.id

  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  variant_id      UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  -- FK → product_variants.id (NULL if no variant selected)

  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_add    NUMERIC(12,2) NOT NULL,  -- Snapshot of price when added (protect against price changes)
  
  -- For bulk orders from company buyers
  discount_applied NUMERIC(12,2) NOT NULL DEFAULT 0.00,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
-- Prevent duplicate product+variant combinations in same cart
CREATE UNIQUE INDEX idx_cart_items_unique
  ON public.cart_items(cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID));

-- ============================================================
-- TABLE: coupons
-- Discount codes (admin creates these)
-- ============================================================
CREATE TABLE public.coupons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT UNIQUE NOT NULL,
  
  description         TEXT,
  coupon_type         coupon_type_enum NOT NULL DEFAULT 'percentage',
  discount_value      NUMERIC(10,2) NOT NULL,   -- % or INR amount
  
  min_order_amount    NUMERIC(12,2),             -- Minimum cart value to apply
  max_discount_cap    NUMERIC(12,2),             -- Max discount amount (for %)
  applicable_user_types user_type_enum[],        -- NULL = all user types
  
  max_uses            INT,                       -- NULL = unlimited
  max_uses_per_user   INT DEFAULT 1,
  used_count          INT NOT NULL DEFAULT 0,
  
  valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until         TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,

  created_by          UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);

-- ============================================================
-- FUNCTION: Generate unique order number
-- Format: ORD-YYYYMMDD-XXXX (e.g. ORD-20240215-0042)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_seq  TEXT;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  v_seq  := LPAD(NEXTVAL('order_number_seq')::TEXT, 5, '0');
  RETURN 'ORD-' || v_date || '-' || v_seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: orders
-- Master order record
-- ============================================================
CREATE TABLE public.orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          TEXT UNIQUE NOT NULL DEFAULT generate_order_number(),
  -- Auto-generated: ORD-20240215-00042

  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  -- FK → profiles.id (buyer)

  order_type            order_type_enum NOT NULL DEFAULT 'individual',

  -- Addresses snapshot (stored as JSONB to preserve historical address even if user edits)
  shipping_address_id   UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  billing_address_id    UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  shipping_address_snapshot JSONB,   -- Exact address at time of order
  billing_address_snapshot  JSONB,

  -- Pricing breakdown
  subtotal              NUMERIC(14,2) NOT NULL DEFAULT 0.00,   -- Before discounts & tax
  discount_amount       NUMERIC(14,2) NOT NULL DEFAULT 0.00,   -- From coupons + bulk discount
  tax_amount            NUMERIC(14,2) NOT NULL DEFAULT 0.00,   -- GST
  shipping_amount       NUMERIC(14,2) NOT NULL DEFAULT 0.00,   -- 0 for digital
  total_amount          NUMERIC(14,2) NOT NULL DEFAULT 0.00,   -- Final charged amount

  -- Status
  order_status          order_status_enum NOT NULL DEFAULT 'pending',
  payment_status        payment_status_enum NOT NULL DEFAULT 'pending',

  -- Notes
  customer_note         TEXT,
  admin_note            TEXT,

  -- Delivery tracking (physical orders)
  tracking_number       TEXT,
  courier_company       TEXT,
  estimated_delivery    DATE,
  delivered_at          TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX idx_orders_order_status ON public.orders(order_status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================
-- TABLE: order_items
-- Individual line items in an order (one per product/variant)
-- ============================================================
CREATE TABLE public.order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  -- FK → orders.id

  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  -- FK → products.id

  variant_id        UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  -- FK → product_variants.id

  seller_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  -- FK → profiles.id (the seller of this item — marketplace model)

  -- Snapshot of product details at time of purchase
  product_name      TEXT NOT NULL,
  product_sku       TEXT,
  variant_details   JSONB,            -- {"RAM": "16GB", "Color": "Black"}
  product_image_url TEXT,

  quantity          INT NOT NULL DEFAULT 1,
  unit_price        NUMERIC(12,2) NOT NULL,        -- Price per unit at purchase time
  cost_price        NUMERIC(12,2) NOT NULL,        -- Cost per unit (for profit calc)
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_amount        NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_price       NUMERIC(12,2) NOT NULL,        -- (unit_price * qty) - discount + tax

  item_type         product_type_enum NOT NULL,    -- 'physical' or 'digital'
  fulfillment_status item_fulfillment_enum NOT NULL DEFAULT 'pending',

  -- Digital fulfillment
  license_key_id    UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
  -- FK → license_keys.id (assigned key for digital products)

  download_url      TEXT,           -- Signed temporary download URL
  download_expires_at TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_seller_id ON public.order_items(seller_id);

-- Add the FK from license_keys back to order_items (circular; added after order_items created)
ALTER TABLE public.license_keys
  ADD CONSTRAINT fk_license_keys_order_item
  FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: payments
-- Payment transaction records via Razorpay
-- ============================================================
CREATE TABLE public.payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  -- FK → orders.id

  -- Razorpay IDs
  razorpay_order_id     TEXT UNIQUE,          -- Created when checkout starts
  razorpay_payment_id   TEXT UNIQUE,          -- Received after payment success
  razorpay_signature    TEXT,                 -- Verification signature

  amount                NUMERIC(14,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'INR',

  status                payment_status_enum NOT NULL DEFAULT 'pending',
  payment_method        TEXT,                 -- 'upi', 'card', 'netbanking', 'wallet', etc.
  payment_provider      TEXT NOT NULL DEFAULT 'razorpay',

  -- Refund tracking
  refund_id             TEXT,
  refund_amount         NUMERIC(14,2),
  refund_reason         TEXT,
  refunded_at           TIMESTAMPTZ,

  -- Metadata from Razorpay webhook
  webhook_payload       JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============================================================
-- TABLE: order_coupons
-- Records which coupon(s) were applied to an order
-- ============================================================
CREATE TABLE public.order_coupons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  coupon_id         UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  discount_applied  NUMERIC(12,2) NOT NULL,

  UNIQUE(order_id, coupon_id)
);

-- ============================================================
-- TABLE: seller_payouts
-- Tracks how much each seller earns per order item (minus commission)
-- ============================================================
CREATE TABLE public.seller_payouts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  -- FK → profiles.id (the seller)

  order_item_id     UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE RESTRICT,
  -- FK → order_items.id (1 payout per order item)

  gross_amount      NUMERIC(14,2) NOT NULL,    -- Total item revenue
  commission_rate   NUMERIC(5,2)  NOT NULL,    -- Platform commission %
  commission_amount NUMERIC(14,2) NOT NULL,    -- commission_rate% of gross_amount
  net_amount        NUMERIC(14,2) NOT NULL,    -- gross - commission (seller receives this)

  payout_status     TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'paid', 'failed'
  payout_reference  TEXT,                      -- Bank transfer / UPI reference
  paid_at           TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_payouts_seller_id ON public.seller_payouts(seller_id);
CREATE INDEX idx_seller_payouts_order_item_id ON public.seller_payouts(order_item_id);
CREATE INDEX idx_seller_payouts_status ON public.seller_payouts(payout_status);

-- ============================================================
-- TRIGGER: Deduct inventory when order item is confirmed
-- Also reserve inventory when order is placed
-- ============================================================
CREATE OR REPLACE FUNCTION handle_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When fulfillment_status changes to 'fulfilled', deduct from inventory
  IF NEW.fulfillment_status = 'fulfilled' AND OLD.fulfillment_status != 'fulfilled' THEN
    UPDATE public.inventory
    SET quantity = quantity - NEW.quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - NEW.quantity)
    WHERE product_id = NEW.product_id
      AND (variant_id = NEW.variant_id OR (variant_id IS NULL AND NEW.variant_id IS NULL));
  END IF;

  -- If cancelled, release reserved inventory
  IF NEW.fulfillment_status = 'cancelled' AND OLD.fulfillment_status != 'cancelled' THEN
    UPDATE public.inventory
    SET reserved_quantity = GREATEST(0, reserved_quantity - NEW.quantity)
    WHERE product_id = NEW.product_id
      AND (variant_id = NEW.variant_id OR (variant_id IS NULL AND NEW.variant_id IS NULL));
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_item_inventory
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION handle_inventory_on_order();

-- ============================================================
-- TRIGGER: Update order totals when items change
-- ============================================================
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.orders
  SET
    subtotal = (
      SELECT COALESCE(SUM(unit_price * quantity), 0)
      FROM public.order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND fulfillment_status != 'cancelled'
    ),
    discount_amount = (
      SELECT COALESCE(SUM(discount_amount), 0)
      FROM public.order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND fulfillment_status != 'cancelled'
    ),
    tax_amount = (
      SELECT COALESCE(SUM(tax_amount), 0)
      FROM public.order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND fulfillment_status != 'cancelled'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_totals_on_item_insert
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_seller_payouts_updated_at
  BEFORE UPDATE ON public.seller_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

-- CARTS: own cart only
CREATE POLICY "Users manage own cart"
  ON public.carts FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Users manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.profile_id = auth.uid())
  );

-- COUPONS: public read active coupons
CREATE POLICY "Public read active coupons"
  ON public.coupons FOR SELECT USING (is_active = TRUE);

-- ORDERS: buyers see own orders; sellers see orders containing their items
CREATE POLICY "Buyers view own orders"
  ON public.orders FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Buyers create own orders"
  ON public.orders FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Buyers update own pending orders"
  ON public.orders FOR UPDATE
  USING (profile_id = auth.uid() AND order_status = 'pending');

-- ORDER ITEMS: own orders
CREATE POLICY "Users view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.profile_id = auth.uid())
  );

-- Sellers view order items for their products
CREATE POLICY "Sellers view their order items"
  ON public.order_items FOR SELECT USING (seller_id = auth.uid());

-- PAYMENTS: buyers see own payment records
CREATE POLICY "Buyers view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.profile_id = auth.uid())
  );

-- SELLER PAYOUTS: sellers see own payouts
CREATE POLICY "Sellers view own payouts"
  ON public.seller_payouts FOR SELECT USING (seller_id = auth.uid());

-- ============================================================
-- END OF FILE 3
-- ============================================================
