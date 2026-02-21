-- ============================================================
-- FILE 1: CORE AUTH & USER TABLES
-- IT E-Commerce Platform - Supabase Schema
-- ============================================================
-- Run this FIRST in your Supabase SQL editor
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_type_enum AS ENUM (
  'individual',       -- Single person buyer
  'company_buyer',    -- Private company buying in bulk
  'wholesaler',       -- Can sell products on platform
  'retailer',         -- Can buy and sell products
  'admin'             -- Super admin
);

CREATE TYPE account_status_enum AS ENUM (
  'active',
  'suspended',
  'pending_verification'
);

CREATE TYPE address_type_enum AS ENUM (
  'shipping',
  'billing',
  'both'
);

-- ============================================================
-- TABLE: profiles
-- Extends Supabase's built-in auth.users table
-- Every user who signs up (Google/Phone OTP) gets a profile
-- ============================================================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- PK: same UUID as auth.users.id (1-to-1 link)

  full_name       TEXT NOT NULL,
  display_name    TEXT,
  email           TEXT UNIQUE,                     -- from Google auth or manual
  phone           TEXT UNIQUE,                     -- from Phone OTP auth
  avatar_url      TEXT,

  user_type       user_type_enum NOT NULL DEFAULT 'individual',
  account_status  account_status_enum NOT NULL DEFAULT 'active',

  is_seller       BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE for wholesaler/retailer selling on platform
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- Token-based session management helper info
  last_login_at   TIMESTAMPTZ,
  login_count     INT NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user_type (admin dashboard queries)
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX idx_profiles_is_seller ON public.profiles(is_seller);

-- ============================================================
-- TABLE: companies
-- Extra info for user_type = company_buyer, wholesaler, retailer
-- One profile can have one company record
-- ============================================================
CREATE TABLE public.companies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id  (1 profile : 1 company)

  company_name      TEXT NOT NULL,
  gst_number        TEXT UNIQUE,
  pan_number        TEXT,
  company_email     TEXT,
  company_phone     TEXT,
  website           TEXT,

  -- Verified by admin before bulk purchases / selling is allowed
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at       TIMESTAMPTZ,
  verified_by       UUID REFERENCES public.profiles(id),  -- admin profile who verified

  -- Auto discount % for company buyers on bulk orders
  default_discount_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,  -- e.g. 10.00 = 10%

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_profile_id ON public.companies(profile_id);

-- ============================================================
-- TABLE: addresses
-- Users can have multiple addresses (shipping / billing)
-- ============================================================
CREATE TABLE public.addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id  (1 profile : many addresses)

  address_type    address_type_enum NOT NULL DEFAULT 'both',
  full_name       TEXT NOT NULL,              -- recipient name
  phone           TEXT NOT NULL,

  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  landmark        TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'India',
  pincode         TEXT NOT NULL,

  is_default      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_profile_id ON public.addresses(profile_id);

-- Ensure only one default address per profile per type
CREATE UNIQUE INDEX idx_addresses_default
  ON public.addresses(profile_id, address_type)
  WHERE is_default = TRUE;

-- ============================================================
-- TABLE: seller_profiles
-- Extra info for sellers (wholesaler / retailer / admin who sells)
-- Linked to profiles where is_seller = TRUE
-- ============================================================
CREATE TABLE public.seller_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- FK → profiles.id (1 profile : 1 seller_profile)

  store_name          TEXT NOT NULL,
  store_slug          TEXT UNIQUE NOT NULL,        -- URL-friendly store name
  store_description   TEXT,
  store_logo_url      TEXT,
  store_banner_url    TEXT,

  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,

  -- Commission % the platform takes from each sale
  commission_rate     NUMERIC(5,2) NOT NULL DEFAULT 5.00,  -- e.g. 5.00 = 5%

  -- Bank/UPI details for payouts (stored as JSON for flexibility)
  bank_details        JSONB DEFAULT '{}',
  -- Example: {"account_no": "...", "ifsc": "...", "upi": "...", "bank_name": "..."}

  total_sales         NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_products      INT NOT NULL DEFAULT 0,
  rating              NUMERIC(3,2),              -- average rating

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_profiles_profile_id ON public.seller_profiles(profile_id);
CREATE INDEX idx_seller_profiles_store_slug ON public.seller_profiles(store_slug);

-- ============================================================
-- TRIGGER: Auto-update updated_at on row changes
-- Applied to all tables above
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create profile when new user signs up via Supabase Auth
-- This fires after INSERT into auth.users (Google/Phone OTP signup)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

-- COMPANIES: Own company only
CREATE POLICY "Users manage own company"
  ON public.companies FOR ALL
  USING (profile_id = auth.uid());

-- ADDRESSES: Own addresses only
CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL
  USING (profile_id = auth.uid());

-- SELLER PROFILES: Own seller profile
CREATE POLICY "Sellers manage own profile"
  ON public.seller_profiles FOR ALL
  USING (profile_id = auth.uid());

-- Public can view seller profiles (for store pages)
CREATE POLICY "Public can view active seller profiles"
  ON public.seller_profiles FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);

-- ============================================================
-- END OF FILE 1
-- ============================================================
