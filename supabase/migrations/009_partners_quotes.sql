-- =============================================
-- PARTNERS & QUOTES SYSTEM
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: Partners (companies, contacts) and Quotes management
-- =============================================

-- =============================================
-- COMPANY CONTACTS
-- =============================================
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

CREATE INDEX idx_company_contacts_tenant ON company_contacts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_company_contacts_company ON company_contacts(company_id) WHERE deleted_at IS NULL;

-- =============================================
-- COMPANY ROLES (how company is related to us)
-- =============================================
CREATE TABLE IF NOT EXISTS company_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'client', 'supplier', 'subcontractor', 'partner', 'manufacturer'
  is_active BOOLEAN DEFAULT TRUE,
  started_at DATE,
  ended_at DATE,
  credit_limit DECIMAL(15,2),
  payment_term_days INTEGER,
  discount_percent DECIMAL(5,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, company_id, role)
);

CREATE INDEX idx_company_roles_tenant ON company_roles(tenant_id);
CREATE INDEX idx_company_roles_company ON company_roles(company_id);
CREATE INDEX idx_company_roles_role ON company_roles(role);

-- =============================================
-- QUOTE ARTICLES (reusable items for quotes)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'tk',
  default_price DECIMAL(15,4),
  cost_price DECIMAL(15,4),
  vat_rate DECIMAL(5,2) DEFAULT 22,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_quote_articles_tenant ON quote_articles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quote_articles_category ON quote_articles(category) WHERE deleted_at IS NULL;

-- =============================================
-- QUOTE UNITS (measurement units)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_plural TEXT,
  symbol TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  category TEXT, -- 'length', 'area', 'volume', 'weight', 'time', 'quantity'
  base_unit_id UUID REFERENCES quote_units(id),
  conversion_factor DECIMAL(20,10) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_quote_units_tenant ON quote_units(tenant_id) WHERE deleted_at IS NULL;

-- =============================================
-- INQUIRIES (päringud - requests for quotes)
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inquiry_number TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES company_contacts(id),
  project_id UUID REFERENCES projects(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'quoted', 'won', 'lost', 'cancelled'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  source TEXT, -- 'email', 'phone', 'web', 'referral'
  received_at TIMESTAMPTZ DEFAULT NOW(),
  response_deadline TIMESTAMPTZ,
  assigned_to UUID,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, inquiry_number)
);

CREATE INDEX idx_inquiries_tenant ON inquiries(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inquiries_status ON inquiries(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inquiries_company ON inquiries(company_id) WHERE deleted_at IS NULL;

-- =============================================
-- QUOTES (hinnapakkumised)
-- =============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  revision INTEGER DEFAULT 1,
  inquiry_id UUID REFERENCES inquiries(id),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES company_contacts(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised'
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  terms_and_conditions TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, quote_number, revision)
);

CREATE INDEX idx_quotes_tenant ON quotes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_status ON quotes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_company ON quotes(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_inquiry ON quotes(inquiry_id) WHERE deleted_at IS NULL;

-- =============================================
-- QUOTE ITEMS (quote line items)
-- =============================================
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  article_id UUID REFERENCES quote_articles(id),
  position INTEGER DEFAULT 0,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(15,4) DEFAULT 1,
  unit TEXT DEFAULT 'tk',
  unit_price DECIMAL(15,4) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 22,
  subtotal DECIMAL(15,2) NOT NULL,
  vat_amount DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_article ON quote_items(article_id);

-- =============================================
-- PROJECT COMPANIES (link projects to multiple companies)
-- =============================================
CREATE TABLE IF NOT EXISTS project_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'client', 'subcontractor', 'supplier', 'consultant'
  contract_value DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, company_id, role)
);

CREATE INDEX idx_project_companies_project ON project_companies(project_id);
CREATE INDEX idx_project_companies_company ON project_companies(company_id);

-- =============================================
-- CONTACT PROJECT RELATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS contact_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES company_contacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT, -- 'project_manager', 'site_manager', 'architect', 'engineer'
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, project_id)
);

CREATE INDEX idx_contact_projects_contact ON contact_projects(contact_id);
CREATE INDEX idx_contact_projects_project ON contact_projects(project_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_company_contacts_updated_at BEFORE UPDATE ON company_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_roles_updated_at BEFORE UPDATE ON company_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_articles_updated_at BEFORE UPDATE ON quote_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_units_updated_at BEFORE UPDATE ON quote_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT DEFAULT UNITS
-- =============================================
-- Note: These will be inserted per tenant when needed
