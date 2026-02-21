-- ============================================================
-- FILE 2: PRODUCTS & INVENTORY TABLES
-- IT E-Commerce Platform - Supabase Schema
-- ============================================================
-- Run this SECOND (after 01_auth_and_users.sql)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE product_type_enum AS ENUM (
  'physical',    -- Computer, chair, CPU, etc.
  'digital'      -- Ebook, software license key, etc.
);

CREATE TYPE product_status_enum AS ENUM (
  'active',
  'inactive',
  'draft',
  'out_of_stock',
  'discontinued'
);

CREATE TYPE delivery_method_enum AS ENUM (
  'email',            -- Key sent via email
  'download',         -- Direct download link
  'lemonsqueezy'      -- Via LemonSqueezy fulfillment
);

-- ============================================================
-- TABLE: categories
-- Hierarchical product categories (self-referential)
-- e.g. Electronics → Computers → Laptops
-- ============================================================
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  -- FK → categories.id (self-join for subcategories; NULL = top-level category)

  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,       -- URL-friendly: "laptops", "software-licenses"
  description   TEXT,
  image_url     TEXT,
  icon          TEXT,                       -- icon name or emoji
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- ============================================================
-- TABLE: products
-- Core product listing (physical or digital)
-- Seller can be a wholesaler, retailer, or admin
-- ============================================================
CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  -- FK → profiles.id (the seller who listed this product)

  category_id         UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  -- FK → categories.id

  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  short_description   TEXT,
  description         TEXT,
  specifications      JSONB DEFAULT '{}',
  -- Example: {"brand": "Dell", "ram": "16GB", "processor": "i7", "warranty": "1 year"}

  product_type        product_type_enum NOT NULL DEFAULT 'physical',
  sku                 TEXT UNIQUE,          -- Stock Keeping Unit

  -- Pricing
  cost_price          NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- What WE paid (never shown to user)
  selling_price       NUMERIC(12,2) NOT NULL,               -- Our listed price
  min_selling_price   NUMERIC(12,2),                        -- Floor: cost + min margin (auto-calc)
  compare_at_price    NUMERIC(12,2),                        -- Crossed-out "MRP" price

  -- Tax
  tax_rate            NUMERIC(5,2) NOT NULL DEFAULT 18.00,  -- GST % (default 18%)
  hsn_code            TEXT,                                 -- GST HSN code

  -- For company/bulk buyers
  min_bulk_qty        INT NOT NULL DEFAULT 1,               -- Min qty for bulk order
  allows_bulk         BOOLEAN NOT NULL DEFAULT FALSE,       -- If TRUE, company buyers can order

  -- Status
  product_status      product_status_enum NOT NULL DEFAULT 'draft',
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,

  -- SEO
  meta_title          TEXT,
  meta_description    TEXT,

  -- Stats
  view_count          INT NOT NULL DEFAULT 0,
  purchase_count      INT NOT NULL DEFAULT 0,
  rating              NUMERIC(3,2),
  review_count        INT NOT NULL DEFAULT 0,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_product_type ON public.products(product_type);
CREATE INDEX idx_products_status ON public.products(product_status);
CREATE INDEX idx_products_slug ON public.products(slug);
-- Full-text search index
CREATE INDEX idx_products_search ON public.products
  USING gin(to_tsvector('english', name || ' ' || COALESCE(short_description, '')));

-- ============================================================
-- TABLE: product_images
-- Multiple images per product; one marked as primary
-- ============================================================
CREATE TABLE public.product_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  image_url     TEXT NOT NULL,
  alt_text      TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
-- Ensure only one primary image per product
CREATE UNIQUE INDEX idx_product_images_primary
  ON public.product_images(product_id)
  WHERE is_primary = TRUE;

-- ============================================================
-- TABLE: product_variants
-- For physical products: color, size, configuration options
-- e.g. "RAM: 8GB", "Color: Black", "Storage: 512GB SSD"
-- ============================================================
CREATE TABLE public.product_variants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id (1 product : many variants)

  variant_name    TEXT NOT NULL,        -- e.g. "RAM"
  variant_value   TEXT NOT NULL,        -- e.g. "16GB"
  sku             TEXT UNIQUE,
  price_modifier  NUMERIC(10,2) NOT NULL DEFAULT 0.00,  -- Added/subtracted from base price
  cost_modifier   NUMERIC(10,2) NOT NULL DEFAULT 0.00,  -- Added to cost price for this variant
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);

-- ============================================================
-- TABLE: inventory
-- Tracks stock for each product (and optionally per variant)
-- One inventory record per product (or per variant if applicable)
-- ============================================================
CREATE TABLE public.inventory (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  variant_id            UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  -- FK → product_variants.id (NULL = applies to base product, not variant-specific)

  quantity              INT NOT NULL DEFAULT 0,          -- Current stock count
  reserved_quantity     INT NOT NULL DEFAULT 0,          -- Reserved in active carts/pending orders
  low_stock_threshold   INT NOT NULL DEFAULT 10,         -- Alert when qty <= this

  -- Restock estimation
  last_restocked_at     TIMESTAMPTZ,
  last_stockout_at      TIMESTAMPTZ,                     -- When it last hit 0
  avg_restock_days      NUMERIC(6,2),                    -- Auto-calculated average
  expected_restock_date DATE,                            -- Admin sets actual date; estimated used until then
  restock_note          TEXT,                            -- Admin note e.g. "Supplier delay"

  -- Warehouse location (optional)
  warehouse_location    TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_inventory_product_variant
  ON public.inventory(product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID));
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);

-- TRIGGER: Update product status to 'out_of_stock' when inventory hits 0
CREATE OR REPLACE FUNCTION sync_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If inventory drops to 0, mark product out_of_stock
  IF NEW.quantity <= 0 THEN
    UPDATE public.products
    SET product_status = 'out_of_stock', updated_at = NOW()
    WHERE id = NEW.product_id;

    -- Record when stock ran out
    NEW.last_stockout_at = NOW();
  END IF;

  -- If inventory restored, set product back to active
  IF NEW.quantity > 0 AND OLD.quantity <= 0 THEN
    -- Calculate average restock days
    IF OLD.last_stockout_at IS NOT NULL THEN
      NEW.avg_restock_days = EXTRACT(EPOCH FROM (NOW() - OLD.last_stockout_at)) / 86400;
    END IF;

    NEW.last_restocked_at = NOW();

    UPDATE public.products
    SET product_status = 'active', updated_at = NOW()
    WHERE id = NEW.product_id AND product_status = 'out_of_stock';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_stock_status
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION sync_product_stock_status();

-- ============================================================
-- TABLE: digital_products
-- Extra info for product_type = 'digital'
-- ============================================================
CREATE TABLE public.digital_products (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id              UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id (1-to-1, only for digital products)

  delivery_method         delivery_method_enum NOT NULL DEFAULT 'email',
  license_type            TEXT NOT NULL DEFAULT 'single',  -- 'single', 'multi', 'subscription'
  max_activations         INT,                              -- NULL = unlimited
  validity_days           INT,                              -- NULL = lifetime

  -- LemonSqueezy integration
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,

  -- Download link (for non-key products like ebooks)
  download_url            TEXT,
  download_expires_hours  INT DEFAULT 48,                  -- Link expiry after purchase

  file_size_mb            NUMERIC(10,2),
  file_format             TEXT,                            -- 'PDF', 'EXE', 'ZIP', etc.

  instructions            TEXT,                            -- Post-purchase install/activation guide

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digital_products_product_id ON public.digital_products(product_id);

-- ============================================================
-- TABLE: license_keys
-- Pool of license keys for digital products
-- Keys are assigned when an order is placed
-- ============================================================
CREATE TABLE public.license_keys (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  digital_product_id  UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  -- FK → digital_products.id (many keys per digital product)

  key_value           TEXT NOT NULL,                  -- The actual license key
  is_used             BOOLEAN NOT NULL DEFAULT FALSE,
  is_reserved         BOOLEAN NOT NULL DEFAULT FALSE,  -- Reserved in pending order

  -- Set when key is assigned to an order
  order_item_id       UUID,                           -- FK set later (after order tables created)
  assigned_at         TIMESTAMPTZ,
  assigned_to         UUID REFERENCES public.profiles(id),
  -- FK → profiles.id

  expires_at          TIMESTAMPTZ,                    -- NULL = never expires
  notes               TEXT,                           -- e.g. "OEM key", "retail key"

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_license_keys_digital_product_id ON public.license_keys(digital_product_id);
CREATE INDEX idx_license_keys_is_used ON public.license_keys(is_used);

-- ============================================================
-- TABLE: competitor_prices
-- Stores fetched prices from Amazon, Flipkart, etc.
-- Used by the pricing engine for auto-adjustment
-- ============================================================
CREATE TABLE public.competitor_prices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id (1 product : many competitor price entries)

  competitor_name   TEXT NOT NULL,        -- 'amazon', 'flipkart', 'croma', etc.
  competitor_url    TEXT,
  competitor_price  NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'INR',

  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current        BOOLEAN NOT NULL DEFAULT TRUE       -- Latest fetched record
);

CREATE INDEX idx_competitor_prices_product_id ON public.competitor_prices(product_id);
CREATE INDEX idx_competitor_prices_is_current ON public.competitor_prices(is_current);

-- ============================================================
-- TABLE: pricing_rules
-- Rules for automatic price adjustment per product
-- Engine logic: if competitor price < our price,
-- drop our price to (competitor - margin_buffer) but never < min_selling_price
-- ============================================================
CREATE TABLE public.pricing_rules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  -- FK → products.id

  auto_adjust_enabled   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Minimum margin above cost_price (in %)
  -- e.g. 10 means we never sell < cost + 10%
  min_margin_percent    NUMERIC(5,2) NOT NULL DEFAULT 10.00,

  -- How much to undercut competitors by (fixed INR amount)
  undercut_by_amount    NUMERIC(10,2) NOT NULL DEFAULT 20.00,

  -- Don't drop price more than this % from original selling_price
  max_discount_percent  NUMERIC(5,2) NOT NULL DEFAULT 30.00,

  last_adjusted_at      TIMESTAMPTZ,
  last_adjusted_price   NUMERIC(12,2),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTION: Auto-adjust price based on competitor prices
-- Called manually or via scheduled job (pg_cron / Edge Function)
-- ============================================================
CREATE OR REPLACE FUNCTION adjust_product_price(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_product        RECORD;
  v_rule           RECORD;
  v_min_competitor NUMERIC;
  v_min_price      NUMERIC;
  v_new_price      NUMERIC;
BEGIN
  -- Get product and rule data
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id;
  SELECT * INTO v_rule FROM public.pricing_rules WHERE product_id = p_product_id;

  IF NOT FOUND OR NOT v_rule.auto_adjust_enabled THEN
    RETURN;
  END IF;

  -- Minimum price = cost + min_margin_percent
  v_min_price := v_product.cost_price * (1 + v_rule.min_margin_percent / 100);

  -- Get lowest competitor price
  SELECT MIN(competitor_price) INTO v_min_competitor
  FROM public.competitor_prices
  WHERE product_id = p_product_id AND is_current = TRUE;

  IF v_min_competitor IS NULL THEN
    RETURN;  -- No competitor data, skip
  END IF;

  -- If competitor is cheaper than us, try to undercut
  IF v_min_competitor < v_product.selling_price THEN
    v_new_price := GREATEST(
      v_min_competitor - v_rule.undercut_by_amount,  -- undercut competitor
      v_min_price                                    -- but never below min price
    );

    -- Also apply max discount cap
    v_new_price := GREATEST(
      v_new_price,
      v_product.selling_price * (1 - v_rule.max_discount_percent / 100)
    );

    -- Update product price
    UPDATE public.products
    SET selling_price = v_new_price, updated_at = NOW()
    WHERE id = p_product_id;

    -- Log in pricing_rules
    UPDATE public.pricing_rules
    SET last_adjusted_at = NOW(), last_adjusted_price = v_new_price
    WHERE product_id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: bulk_discount_rules
-- Tiered discounts for company buyers, wholesalers, retailers
-- ============================================================
CREATE TABLE public.bulk_discount_rules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicable_user_types user_type_enum[] NOT NULL,  -- Apply to these user types
  category_id           UUID REFERENCES public.categories(id),  -- NULL = all categories
  product_id            UUID REFERENCES public.products(id),     -- NULL = all products in category

  min_quantity          INT NOT NULL DEFAULT 1,
  max_quantity          INT,                          -- NULL = no upper limit
  discount_percent      NUMERIC(5,2) NOT NULL,       -- e.g. 15.00 = 15%

  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from            TIMESTAMPTZ,
  valid_until           TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bulk_discount_category ON public.bulk_discount_rules(category_id);
CREATE INDEX idx_bulk_discount_product ON public.bulk_discount_rules(product_id);

-- ============================================================
-- Updated_at triggers for new tables
-- ============================================================
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_discount_rules ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT USING (is_active = TRUE);

-- Products: public read active products
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT USING (is_active = TRUE AND product_status = 'active');

-- Products: sellers can CRUD their own products
CREATE POLICY "Sellers manage own products"
  ON public.products FOR ALL
  USING (seller_id = auth.uid());

-- Product images: public read
CREATE POLICY "Public read product images"
  ON public.product_images FOR SELECT USING (TRUE);

-- Sellers manage images of their products
CREATE POLICY "Sellers manage product images"
  ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.seller_id = auth.uid()
    )
  );

-- Product variants: public read
CREATE POLICY "Public read product variants"
  ON public.product_variants FOR SELECT USING (is_active = TRUE);

-- Inventory: sellers/admins read own inventory; public can see quantity and restock info
CREATE POLICY "Public read inventory availability"
  ON public.inventory FOR SELECT USING (TRUE);

-- Digital products: public read
CREATE POLICY "Public read digital products"
  ON public.digital_products FOR SELECT USING (TRUE);

-- License keys: only admins and sellers can read keys (not individual key values publicly)
CREATE POLICY "Sellers manage their license keys"
  ON public.license_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_products dp
      JOIN public.products p ON p.id = dp.product_id
      WHERE dp.id = license_keys.digital_product_id AND p.seller_id = auth.uid()
    )
  );

-- Bulk discount rules: public read
CREATE POLICY "Public read bulk discount rules"
  ON public.bulk_discount_rules FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- END OF FILE 2
-- ============================================================
