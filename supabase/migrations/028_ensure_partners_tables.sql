-- =============================================
-- ENSURE COMPANIES AND CONTACTS TABLES EXIST
-- =============================================
-- This migration ensures all partner-related tables exist
-- and refreshes the schema cache
-- =============================================

-- Companies table (if not exists from initial schema)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  registry_code TEXT,
  vat_number TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'client',
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Estonia',
  bank_account TEXT,
  payment_term_days INTEGER DEFAULT 14,
  credit_limit DECIMAL(15,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add missing columns to companies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'registry_code') THEN
    ALTER TABLE companies ADD COLUMN registry_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'vat_number') THEN
    ALTER TABLE companies ADD COLUMN vat_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'type') THEN
    ALTER TABLE companies ADD COLUMN type TEXT DEFAULT 'client';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'bank_account') THEN
    ALTER TABLE companies ADD COLUMN bank_account TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'payment_term_days') THEN
    ALTER TABLE companies ADD COLUMN payment_term_days INTEGER DEFAULT 14;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'credit_limit') THEN
    ALTER TABLE companies ADD COLUMN credit_limit DECIMAL(15,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'notes') THEN
    ALTER TABLE companies ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'metadata') THEN
    ALTER TABLE companies ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'deleted_at') THEN
    ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Company contacts table
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  position TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_billing_contact BOOLEAN DEFAULT FALSE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add missing columns to company_contacts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'mobile') THEN
    ALTER TABLE company_contacts ADD COLUMN mobile TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'position') THEN
    ALTER TABLE company_contacts ADD COLUMN position TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'department') THEN
    ALTER TABLE company_contacts ADD COLUMN department TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'is_primary') THEN
    ALTER TABLE company_contacts ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'is_billing_contact') THEN
    ALTER TABLE company_contacts ADD COLUMN is_billing_contact BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'notes') THEN
    ALTER TABLE company_contacts ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'metadata') THEN
    ALTER TABLE company_contacts ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'deleted_at') THEN
    ALTER TABLE company_contacts ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_registry_code ON companies(registry_code) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_contacts_tenant ON company_contacts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id) WHERE deleted_at IS NULL;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
