-- ============================================================
-- FILE 4: SUPPORTING FEATURES, FUNCTIONS & FINAL SETUP
-- IT E-Commerce Platform - Supabase Schema
-- ============================================================
-- Run this LAST (after 03_cart_orders_payments.sql)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE notification_type_enum AS ENUM (
  'low_stock',            -- Stock is below threshold
  'out_of_stock',         -- Stock hit zero
  'restock_expected',     -- Estimated restock date
  'order_confirmed',      -- Order placed successfully
  'order_shipped',        -- Physical order dispatched
  'order_delivered',      -- Delivered
  'payment_success',      -- Payment captured
  'payment_failed',       -- Payment failed
  'digital_delivered',    -- License key / download sent
  'payout_processed',     -- Seller received payout
  'seller_verified',      -- Seller account approved
  'review_received',      -- Seller: new review on product
  'price_adjusted',       -- Auto price adjustment happened
  'affiliate_earned'      -- Affiliate commission earned
);

-- ============================================================
-- TABLE: wishlists
-- Users save products for later
-- ============================================================
CREATE TABLE public.wishlists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id

  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, product_id)
  -- Prevents same product being wishlisted twice by same user
);

CREATE INDEX idx_wishlists_profile_id ON public.wishlists(profile_id);
CREATE INDEX idx_wishlists_product_id ON public.wishlists(product_id);

-- ============================================================
-- TABLE: product_reviews
-- Verified purchase reviews by buyers
-- ============================================================
CREATE TABLE public.product_reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id (reviewer)

  order_item_id         UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  -- FK → order_items.id (ensures only buyers can review; NULL if not verified)

  rating                SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 TEXT,
  review_text           TEXT,

  is_verified_purchase  BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved           BOOLEAN NOT NULL DEFAULT TRUE,  -- Admin can hide reviews
  helpful_count         INT NOT NULL DEFAULT 0,

  -- Seller reply to review
  seller_reply          TEXT,
  seller_replied_at     TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, product_id, order_item_id)
  -- One review per product per order item to prevent duplicates
);

CREATE INDEX idx_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_reviews_profile_id ON public.product_reviews(profile_id);
CREATE INDEX idx_reviews_rating ON public.product_reviews(rating);

-- TRIGGER: Update product rating when a review is added/changed
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg    NUMERIC;
  v_count  INT;
BEGIN
  SELECT AVG(rating), COUNT(*)
  INTO v_avg, v_count
  FROM public.product_reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_approved = TRUE;

  UPDATE public.products
  SET rating = ROUND(v_avg, 2),
      review_count = v_count,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================================
-- TABLE: notifications
-- In-app notifications for all users and sellers
-- ============================================================
CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id (recipient)

  notification_type notification_type_enum NOT NULL,

  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  action_url      TEXT,             -- Deep link e.g. /orders/ORD-20240215-00001
  icon            TEXT,             -- Optional icon name

  metadata        JSONB DEFAULT '{}',
  -- e.g. {"order_id": "...", "product_id": "...", "amount": 500}

  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,

  -- Email/SMS delivery status
  email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  sms_sent        BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(profile_id, is_read);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================================
-- FUNCTION: Send low stock notification to seller
-- Called by inventory trigger when stock < threshold
-- ============================================================
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id   UUID;
  v_product_name TEXT;
BEGIN
  -- Only fire when quantity drops below threshold or hits 0
  IF NEW.quantity <= NEW.low_stock_threshold AND
     (OLD.quantity > OLD.low_stock_threshold OR OLD.quantity > 0) THEN

    SELECT p.seller_id, p.name INTO v_seller_id, v_product_name
    FROM public.products p WHERE p.id = NEW.product_id;

    IF NEW.quantity = 0 THEN
      INSERT INTO public.notifications (profile_id, notification_type, title, message, metadata, action_url)
      VALUES (
        v_seller_id,
        'out_of_stock',
        '🚨 Product Out of Stock!',
        v_product_name || ' is now OUT OF STOCK. Please restock immediately.',
        jsonb_build_object('product_id', NEW.product_id, 'quantity', NEW.quantity),
        '/seller/inventory/' || NEW.product_id::TEXT
      );
    ELSE
      INSERT INTO public.notifications (profile_id, notification_type, title, message, metadata, action_url)
      VALUES (
        v_seller_id,
        'low_stock',
        '⚠️ Low Stock Alert',
        v_product_name || ' only has ' || NEW.quantity || ' units left (threshold: ' || NEW.low_stock_threshold || ').',
        jsonb_build_object('product_id', NEW.product_id, 'quantity', NEW.quantity, 'threshold', NEW.low_stock_threshold),
        '/seller/inventory/' || NEW.product_id::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_notification
  AFTER UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- ============================================================
-- TABLE: restock_requests
-- Admin/seller manages restock scheduling
-- ============================================================
CREATE TABLE public.restock_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  inventory_id        UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  -- FK → inventory.id

  requested_by        UUID REFERENCES public.profiles(id),
  -- FK → profiles.id (seller or admin who raised request)

  requested_quantity  INT NOT NULL,
  actual_quantity     INT,          -- filled when received
  supplier_name       TEXT,
  supplier_contact    TEXT,
  estimated_arrival   DATE,
  actual_arrival      DATE,

  status              TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'ordered', 'in_transit', 'received', 'cancelled'

  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restock_product_id ON public.restock_requests(product_id);
CREATE INDEX idx_restock_status ON public.restock_requests(status);

-- ============================================================
-- TABLE: affiliate_links
-- LemonSqueezy affiliate tracking
-- Users earn commission when someone buys via their link
-- ============================================================
CREATE TABLE public.affiliate_links (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id (affiliate)

  product_id              UUID REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id  (NULL = site-wide affiliate link)

  unique_code             TEXT UNIQUE NOT NULL,       -- /ref/UNIQUE_CODE
  lemonsqueezy_affiliate_id TEXT,                     -- LemonSqueezy affiliate ID

  commission_rate         NUMERIC(5,2) NOT NULL DEFAULT 5.00,  -- % of sale
  
  -- Analytics
  clicks                  INT NOT NULL DEFAULT 0,
  conversions             INT NOT NULL DEFAULT 0,
  total_earnings          NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  pending_earnings        NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  paid_earnings           NUMERIC(14,2) NOT NULL DEFAULT 0.00,

  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_links_profile_id ON public.affiliate_links(profile_id);
CREATE INDEX idx_affiliate_links_unique_code ON public.affiliate_links(unique_code);

-- ============================================================
-- TABLE: affiliate_conversions
-- Records each conversion through an affiliate link
-- ============================================================
CREATE TABLE public.affiliate_conversions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  -- FK → affiliate_links.id

  order_id          UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  -- FK → orders.id

  commission_amount NUMERIC(12,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'paid', 'rejected'
  paid_at           TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_conversions_link_id ON public.affiliate_conversions(affiliate_link_id);

-- ============================================================
-- TABLE: product_price_history
-- Logs every price change for analytics and audit
-- ============================================================
CREATE TABLE public.product_price_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  old_price       NUMERIC(12,2) NOT NULL,
  new_price       NUMERIC(12,2) NOT NULL,
  change_reason   TEXT,   -- 'auto_adjustment', 'manual', 'promotion', etc.
  changed_by      UUID REFERENCES public.profiles(id),  -- NULL = auto-adjusted

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_id ON public.product_price_history(product_id);

-- TRIGGER: Log price changes automatically
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.selling_price <> OLD.selling_price THEN
    INSERT INTO public.product_price_history (product_id, old_price, new_price, change_reason)
    VALUES (NEW.id, OLD.selling_price, NEW.selling_price, 'auto_or_manual');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_price_change
  AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION log_price_change();

-- ============================================================
-- TABLE: site_settings
-- Admin-configurable site settings
-- ============================================================
CREATE TABLE public.site_settings (
  key       TEXT PRIMARY KEY,
  value     JSONB NOT NULL,
  label     TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.site_settings (key, value, label) VALUES
  ('site_name', '"IT Store"', 'Site Name'),
  ('currency', '"INR"', 'Default Currency'),
  ('tax_rate_default', '18', 'Default GST Rate (%)'),
  ('low_stock_global_threshold', '10', 'Global Low Stock Threshold'),
  ('razorpay_enabled', 'true', 'Razorpay Payment Active'),
  ('lemonsqueezy_enabled', 'true', 'LemonSqueezy Active'),
  ('competitor_price_check_interval_hours', '24', 'Competitor Price Refresh Interval'),
  ('free_shipping_threshold', '999', 'Free Shipping Above (INR)'),
  ('max_cart_items', '50', 'Max Items in Cart'),
  ('bulk_order_min_qty', '10', 'Min Qty for Bulk Order Classification');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: products with inventory status (used in product listing)
CREATE OR REPLACE VIEW public.v_products_with_stock AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.seller_id,
  p.category_id,
  p.product_type,
  p.selling_price,
  p.compare_at_price,
  p.cost_price,
  p.product_status,
  p.is_featured,
  p.rating,
  p.review_count,
  p.allows_bulk,
  p.min_bulk_qty,
  COALESCE(i.quantity, 0) AS stock_quantity,
  COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
  COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0) AS available_quantity,
  i.low_stock_threshold,
  i.avg_restock_days,
  i.expected_restock_date,
  CASE
    WHEN COALESCE(i.quantity, 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(i.quantity, 0) <= COALESCE(i.low_stock_threshold, 10) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  pi_img.image_url AS primary_image_url,
  p.created_at
FROM public.products p
LEFT JOIN public.inventory i ON i.product_id = p.id AND i.variant_id IS NULL
LEFT JOIN public.product_images pi_img ON pi_img.product_id = p.id AND pi_img.is_primary = TRUE
WHERE p.is_active = TRUE;

-- View: seller dashboard summary
CREATE OR REPLACE VIEW public.v_seller_summary AS
SELECT
  sp.profile_id AS seller_id,
  sp.store_name,
  sp.commission_rate,
  COUNT(DISTINCT p.id) AS total_products,
  COALESCE(SUM(oi.total_price), 0) AS total_revenue,
  COALESCE(SUM(payout.net_amount), 0) AS total_payout_earned,
  COUNT(DISTINCT o.id) AS total_orders
FROM public.seller_profiles sp
LEFT JOIN public.products p ON p.seller_id = sp.profile_id
LEFT JOIN public.order_items oi ON oi.seller_id = sp.profile_id
LEFT JOIN public.orders o ON o.id = oi.order_id AND o.payment_status = 'captured'
LEFT JOIN public.seller_payouts payout ON payout.seller_id = sp.profile_id
WHERE sp.is_active = TRUE
GROUP BY sp.profile_id, sp.store_name, sp.commission_rate;

-- View: order details with buyer info (admin use)
CREATE OR REPLACE VIEW public.v_order_details AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.order_type,
  o.order_status,
  o.payment_status,
  o.total_amount,
  o.created_at AS order_date,
  o.tracking_number,
  pr.full_name AS buyer_name,
  pr.email AS buyer_email,
  pr.phone AS buyer_phone,
  pr.user_type,
  pay.razorpay_payment_id,
  pay.payment_method
FROM public.orders o
JOIN public.profiles pr ON pr.id = o.profile_id
LEFT JOIN public.payments pay ON pay.order_id = o.id AND pay.status = 'captured';

-- ============================================================
-- FUNCTION: Get bulk discount for a buyer
-- Returns discount % for given user, product, quantity
-- ============================================================
CREATE OR REPLACE FUNCTION get_bulk_discount(
  p_user_type    user_type_enum,
  p_product_id   UUID,
  p_category_id  UUID,
  p_quantity     INT
)
RETURNS NUMERIC AS $$
DECLARE
  v_discount NUMERIC := 0;
BEGIN
  SELECT COALESCE(MAX(discount_percent), 0) INTO v_discount
  FROM public.bulk_discount_rules
  WHERE is_active = TRUE
    AND p_user_type = ANY(applicable_user_types)
    AND min_quantity <= p_quantity
    AND (max_quantity IS NULL OR max_quantity >= p_quantity)
    AND (
      (product_id = p_product_id) OR
      (product_id IS NULL AND category_id = p_category_id) OR
      (product_id IS NULL AND category_id IS NULL)
    )
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Check and reserve stock when item added to cart
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity   INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INT;
BEGIN
  SELECT (quantity - reserved_quantity) INTO v_available
  FROM public.inventory
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));

  IF v_available >= p_quantity THEN
    UPDATE public.inventory
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE product_id = p_product_id
      AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL));
    RETURN TRUE;
  END IF;

  RETURN FALSE;  -- Not enough stock
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Full-text product search
-- Usage: SELECT * FROM search_products('gaming laptop', 10, 0);
-- ============================================================
CREATE OR REPLACE FUNCTION search_products(
  p_query      TEXT,
  p_limit      INT DEFAULT 20,
  p_offset     INT DEFAULT 0
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  slug         TEXT,
  selling_price NUMERIC,
  stock_status TEXT,
  primary_image_url TEXT,
  rating       NUMERIC,
  rank         REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.slug,
    v.selling_price,
    v.stock_status,
    v.primary_image_url,
    v.rating,
    ts_rank(to_tsvector('english', v.name), plainto_tsquery('english', p_query)) AS rank
  FROM public.v_products_with_stock v
  WHERE to_tsvector('english', v.name) @@ plainto_tsquery('english', p_query)
     OR v.name ILIKE '%' || p_query || '%'
  ORDER BY rank DESC, v.rating DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS for new tables
-- ============================================================

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- WISHLISTS
CREATE POLICY "Users manage own wishlist"
  ON public.wishlists FOR ALL USING (profile_id = auth.uid());

-- REVIEWS: public read approved; own user can write
CREATE POLICY "Public read approved reviews"
  ON public.product_reviews FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users write own reviews"
  ON public.product_reviews FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users update own reviews"
  ON public.product_reviews FOR UPDATE USING (profile_id = auth.uid());

-- NOTIFICATIONS: own only
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users mark own notifications read"
  ON public.notifications FOR UPDATE USING (profile_id = auth.uid());

-- AFFILIATE LINKS: own only, public read
CREATE POLICY "Affiliates manage own links"
  ON public.affiliate_links FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Public view active affiliate links"
  ON public.affiliate_links FOR SELECT USING (is_active = TRUE);

-- RESTOCK REQUESTS: sellers manage own
CREATE POLICY "Sellers view own restock requests"
  ON public.restock_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = restock_requests.product_id AND p.seller_id = auth.uid()
    )
  );

-- PRICE HISTORY: sellers see own product price history
CREATE POLICY "Sellers view own price history"
  ON public.product_price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_price_history.product_id AND p.seller_id = auth.uid()
    )
  );

-- ============================================================
-- GRANT service_role full access (for Edge Functions / backend)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Authenticated users: read access to views
GRANT SELECT ON public.v_products_with_stock TO authenticated, anon;
GRANT SELECT ON public.v_seller_summary TO authenticated;

-- ============================================================
-- SEED: Default Admin User Placeholder
-- After creating your first user via Supabase Auth,
-- run this with the actual UUID:
-- UPDATE public.profiles SET user_type = 'admin' WHERE email = 'your@admin.email';
-- ============================================================

-- ============================================================
-- SEED: Sample Categories
-- ============================================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Computers & Laptops', 'computers-laptops', 'Desktop computers and laptops', 1),
  ('Computer Components', 'computer-components', 'CPUs, RAM, GPUs, Motherboards', 2),
  ('Peripherals', 'peripherals', 'Keyboard, Mouse, Monitor, Headset', 3),
  ('Office Furniture', 'office-furniture', 'Chairs, Desks, Tables for IT setup', 4),
  ('Networking', 'networking', 'Routers, Switches, Cables, Access Points', 5),
  ('Software Licenses', 'software-licenses', 'Windows, Office, Antivirus Keys', 6),
  ('eBooks & Digital Courses', 'ebooks-digital-courses', 'IT Books, Programming Courses, Certifications', 7),
  ('Storage Devices', 'storage-devices', 'SSDs, HDDs, USB Drives, Memory Cards', 8),
  ('Power & UPS', 'power-ups', 'UPS, Surge Protectors, Power Strips', 9),
  ('Accessories', 'accessories', 'Bags, Cooling Pads, Webcams, Adapters', 10);

-- Sub-categories
INSERT INTO public.categories (name, slug, description, parent_id, sort_order)
  SELECT 'Laptops', 'laptops', 'Portable computers', id, 1
  FROM public.categories WHERE slug = 'computers-laptops';

INSERT INTO public.categories (name, slug, description, parent_id, sort_order)
  SELECT 'Desktop PCs', 'desktop-pcs', 'Full desktop systems', id, 2
  FROM public.categories WHERE slug = 'computers-laptops';

INSERT INTO public.categories (name, slug, description, parent_id, sort_order)
  SELECT 'Processors (CPU)', 'processors-cpu', 'Intel and AMD CPUs', id, 1
  FROM public.categories WHERE slug = 'computer-components';

INSERT INTO public.categories (name, slug, description, parent_id, sort_order)
  SELECT 'Graphics Cards (GPU)', 'graphics-cards-gpu', 'Desktop and workstation GPUs', id, 2
  FROM public.categories WHERE slug = 'computer-components';

-- ============================================================
-- END OF FILE 4 - SCHEMA COMPLETE
-- ============================================================
-- Summary of all tables created:
-- FILE 1: profiles, companies, addresses, seller_profiles
-- FILE 2: categories, products, product_images, product_variants,
--         inventory, digital_products, license_keys,
--         competitor_prices, pricing_rules, bulk_discount_rules
-- FILE 3: carts, cart_items, coupons, orders, order_items,
--         payments, order_coupons, seller_payouts
-- FILE 4: wishlists, product_reviews, notifications,
--         restock_requests, affiliate_links, affiliate_conversions,
--         product_price_history, site_settings
-- ============================================================
