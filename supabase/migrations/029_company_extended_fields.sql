-- =============================================
-- ADD EXTENDED COMPANY FIELDS FROM REGISTRY
-- =============================================
-- Adds fields available from Estonian Business Registry
-- without requiring a contract
-- =============================================

-- Add new columns to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registry_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS historical_names TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_status TEXT DEFAULT 'R'; -- R=registered, L=liquidation, N=deleted, K=bankrupt

-- E-invoice capability
ALTER TABLE companies ADD COLUMN IF NOT EXISTS e_invoice_capable BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS e_invoice_operator TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS e_invoice_address TEXT;

-- Create index for e-invoice capable companies
CREATE INDEX IF NOT EXISTS idx_companies_e_invoice ON companies(e_invoice_capable) WHERE e_invoice_capable = TRUE;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
