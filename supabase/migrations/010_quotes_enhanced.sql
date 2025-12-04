-- =============================================
-- QUOTES SYSTEM ENHANCED
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: Enhanced quotes system with bilingual support,
--              price statistics, comments, and revisions
-- =============================================

-- =============================================
-- ENHANCE QUOTE_UNITS TABLE
-- Add bilingual support
-- =============================================

-- Add translated columns
ALTER TABLE quote_units
ADD COLUMN IF NOT EXISTS name_et TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_plural_et TEXT,
ADD COLUMN IF NOT EXISTS name_plural_en TEXT,
ADD COLUMN IF NOT EXISTS symbol_et TEXT,
ADD COLUMN IF NOT EXISTS symbol_en TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrate existing data to ET columns
UPDATE quote_units SET
  name_et = name,
  name_plural_et = name_plural,
  symbol_et = symbol
WHERE name_et IS NULL;

-- Set EN defaults (same as ET initially)
UPDATE quote_units SET
  name_en = name_et,
  name_plural_en = name_plural_et,
  symbol_en = symbol_et
WHERE name_en IS NULL;

-- =============================================
-- ENHANCE QUOTE_ARTICLES TABLE
-- Add bilingual support and price statistics
-- =============================================

ALTER TABLE quote_articles
ADD COLUMN IF NOT EXISTS name_et TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_et TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES quote_units(id),
ADD COLUMN IF NOT EXISTS min_price DECIMAL(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_price DECIMAL(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_price DECIMAL(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_price DECIMAL(15,4),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Migrate existing data
UPDATE quote_articles SET
  name_et = name,
  description_et = description
WHERE name_et IS NULL;

UPDATE quote_articles SET
  name_en = name_et,
  description_en = description_et
WHERE name_en IS NULL;

-- Initialize price stats
UPDATE quote_articles SET
  min_price = default_price,
  max_price = default_price,
  avg_price = default_price
WHERE min_price = 0 AND default_price IS NOT NULL;

-- =============================================
-- ENHANCE QUOTES TABLE
-- Add bilingual notes, revision tracking, language
-- =============================================

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'et',
ADD COLUMN IF NOT EXISTS valid_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS notes_et TEXT,
ADD COLUMN IF NOT EXISTS notes_en TEXT,
ADD COLUMN IF NOT EXISTS terms_et TEXT,
ADD COLUMN IF NOT EXISTS terms_en TEXT,
ADD COLUMN IF NOT EXISTS files_folder TEXT,
ADD COLUMN IF NOT EXISTS pdf_url_et TEXT,
ADD COLUMN IF NOT EXISTS pdf_url_en TEXT,
ADD COLUMN IF NOT EXISTS is_latest_revision BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS previous_revision_id UUID REFERENCES quotes(id),
ADD COLUMN IF NOT EXISTS next_revision_id UUID REFERENCES quotes(id),
ADD COLUMN IF NOT EXISTS last_modified_by UUID;

-- Migrate existing data
UPDATE quotes SET
  notes_et = notes,
  terms_et = terms_and_conditions,
  year = EXTRACT(YEAR FROM created_at)::INTEGER,
  revision_number = revision
WHERE notes_et IS NULL AND notes IS NOT NULL;

-- Set sequence numbers based on existing quotes
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id, year ORDER BY created_at) as seq
  FROM quotes
  WHERE sequence_number IS NULL
)
UPDATE quotes q SET sequence_number = n.seq
FROM numbered n
WHERE q.id = n.id AND q.sequence_number IS NULL;

-- =============================================
-- ENHANCE QUOTE_ITEMS TABLE
-- Add bilingual support and grouping
-- =============================================

ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS name_et TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_et TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS notes_et TEXT,
ADD COLUMN IF NOT EXISTS notes_en TEXT,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES quote_units(id);

-- Migrate existing data
UPDATE quote_items SET
  name_et = name,
  description_et = description,
  notes_et = notes
WHERE name_et IS NULL;

UPDATE quote_items SET
  name_en = name_et,
  description_en = description_et,
  notes_en = notes_et
WHERE name_en IS NULL;

-- =============================================
-- QUOTE ITEM GROUPS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_item_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name_et TEXT NOT NULL,
  name_en TEXT,
  description_et TEXT,
  description_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_item_groups_quote ON quote_item_groups(quote_id);

-- Add foreign key to quote_items
ALTER TABLE quote_items
ADD CONSTRAINT fk_quote_items_group
FOREIGN KEY (group_id) REFERENCES quote_item_groups(id) ON DELETE SET NULL;

-- =============================================
-- QUOTE COMMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quote_comments_quote ON quote_comments(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quote_comments_user ON quote_comments(user_id) WHERE deleted_at IS NULL;

-- =============================================
-- QUOTE ACTIVITY LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'quote', 'inquiry', 'article', 'unit'
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'sent', etc.
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_activity_entity ON quote_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_quote_activity_user ON quote_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_activity_date ON quote_activity_logs(created_at DESC);

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_quote', 'reminder', 'follow_up', 'thank_you'
  name TEXT NOT NULL,
  subject_et TEXT NOT NULL,
  subject_en TEXT NOT NULL,
  body_et TEXT NOT NULL,
  body_en TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_email_templates_tenant ON quote_email_templates(tenant_id);

-- =============================================
-- EMAIL QUEUE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[] DEFAULT '{}',
  bcc_addresses TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  language VARCHAR(2) DEFAULT 'et',
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quote_email_queue_status ON quote_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_quote_email_queue_quote ON quote_email_queue(quote_id);

-- =============================================
-- PROJECT RESOURCES TABLE (Planning)
-- =============================================

CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'person', 'equipment'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  allocated_hours DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_resources_project ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_dates ON project_resources(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource ON project_resources(resource_name);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_quote_item_groups_updated_at BEFORE UPDATE ON quote_item_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_comments_updated_at BEFORE UPDATE ON quote_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_email_templates_updated_at BEFORE UPDATE ON quote_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_resources_updated_at BEFORE UPDATE ON project_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Update article price statistics
-- =============================================

CREATE OR REPLACE FUNCTION update_article_price_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics for the article when a quote item is created/updated
  IF NEW.article_id IS NOT NULL THEN
    UPDATE quote_articles
    SET
      usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = NOW(),
      last_used_price = NEW.unit_price,
      min_price = LEAST(COALESCE(min_price, NEW.unit_price), NEW.unit_price),
      max_price = GREATEST(COALESCE(max_price, NEW.unit_price), NEW.unit_price),
      total_revenue = COALESCE(total_revenue, 0) + NEW.total
    WHERE id = NEW.article_id;

    -- Update average price
    UPDATE quote_articles a
    SET avg_price = (
      SELECT AVG(qi.unit_price)
      FROM quote_items qi
      WHERE qi.article_id = a.id
    )
    WHERE id = NEW.article_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price stats
DROP TRIGGER IF EXISTS trigger_update_article_price_stats ON quote_items;
CREATE TRIGGER trigger_update_article_price_stats
  AFTER INSERT OR UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_article_price_stats();

-- =============================================
-- FUNCTION: Generate quote number
-- =============================================

CREATE OR REPLACE FUNCTION generate_quote_number(
  p_tenant_id UUID,
  p_revision_of UUID DEFAULT NULL
)
RETURNS TABLE (
  quote_number TEXT,
  year INTEGER,
  sequence_number INTEGER,
  revision_number INTEGER
) AS $$
DECLARE
  v_year INTEGER;
  v_seq INTEGER;
  v_rev INTEGER;
  v_parent_seq INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  IF p_revision_of IS NOT NULL THEN
    -- Get parent quote's sequence number and increment revision
    SELECT q.sequence_number, q.revision_number + 1
    INTO v_parent_seq, v_rev
    FROM quotes q
    WHERE q.id = p_revision_of;

    v_seq := v_parent_seq;
  ELSE
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(q.sequence_number), 0) + 1
    INTO v_seq
    FROM quotes q
    WHERE q.tenant_id = p_tenant_id
      AND q.year = v_year;

    v_rev := 1;
  END IF;

  RETURN QUERY SELECT
    FORMAT('%s-%s-R%s', v_year, LPAD(v_seq::TEXT, 3, '0'), v_rev),
    v_year,
    v_seq,
    v_rev;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INSERT DEFAULT EMAIL TEMPLATES
-- =============================================

INSERT INTO quote_email_templates (tenant_id, type, name, subject_et, subject_en, body_et, body_en, is_default)
SELECT
  id as tenant_id,
  'new_quote',
  'Uus pakkumine',
  'Hinnapakkumine {{quote_number}}',
  'Quotation {{quote_number}}',
  E'Tere {{contact_name}},\n\nSaadan Teile hinnapakkumise projekti {{project_name}} kohta.\n\nPakkumise number: {{quote_number}}\nKehtivus: {{valid_days}} päeva\nKogusumma: {{total}} EUR (koos KM-ga)\n\nPakkumine on lisatud manusesse.\n\nKüsimuste korral võtke julgelt ühendust.\n\nLugupidamisega,\n{{sender_name}}\nRIVEST OÜ\n+372 5550 5580\ninfo@rivest.ee',
  E'Dear {{contact_name}},\n\nPlease find attached our quotation for project {{project_name}}.\n\nQuotation number: {{quote_number}}\nValidity: {{valid_days}} days\nTotal amount: {{total}} EUR (incl. VAT)\n\nThe quotation is attached to this email.\n\nPlease do not hesitate to contact us if you have any questions.\n\nBest regards,\n{{sender_name}}\nRIVEST OÜ\n+372 5550 5580\ninfo@rivest.ee',
  TRUE
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM quote_email_templates WHERE type = 'new_quote' AND tenant_id = tenants.id
);

-- =============================================
-- INSERT DEFAULT UNITS (bilingual)
-- =============================================

INSERT INTO quote_units (tenant_id, code, name, name_et, name_en, name_plural, name_plural_et, name_plural_en, symbol, symbol_et, symbol_en, category, sort_order, is_default, is_active)
SELECT
  id as tenant_id,
  d.code,
  d.name_et,
  d.name_et,
  d.name_en,
  d.name_plural_et,
  d.name_plural_et,
  d.name_plural_en,
  d.symbol_et,
  d.symbol_et,
  d.symbol_en,
  d.category,
  d.sort_order,
  d.is_default,
  TRUE
FROM tenants
CROSS JOIN (
  VALUES
    ('tk', 'Tükk', 'Piece', 'tükki', 'pieces', 'tk', 'pcs', 'quantity', 1, TRUE),
    ('m', 'Meeter', 'Meter', 'meetrit', 'meters', 'm', 'm', 'length', 2, FALSE),
    ('m2', 'Ruutmeeter', 'Square meter', 'ruutmeetrit', 'square meters', 'm²', 'm²', 'area', 3, FALSE),
    ('m3', 'Kuupmeeter', 'Cubic meter', 'kuupmeetrit', 'cubic meters', 'm³', 'm³', 'volume', 4, FALSE),
    ('jm', 'Jooksevmeeter', 'Running meter', 'jooksevmeetrit', 'running meters', 'jm', 'rm', 'length', 5, FALSE),
    ('kg', 'Kilogramm', 'Kilogram', 'kilogrammi', 'kilograms', 'kg', 'kg', 'weight', 6, FALSE),
    ('t', 'Tonn', 'Ton', 'tonni', 'tons', 't', 't', 'weight', 7, FALSE),
    ('h', 'Tund', 'Hour', 'tundi', 'hours', 'h', 'h', 'time', 8, FALSE),
    ('kpl', 'Komplekt', 'Set', 'komplekti', 'sets', 'kpl', 'set', 'quantity', 9, FALSE),
    ('l', 'Liiter', 'Liter', 'liitrit', 'liters', 'l', 'l', 'volume', 10, FALSE)
) AS d(code, name_et, name_en, name_plural_et, name_plural_en, symbol_et, symbol_en, category, sort_order, is_default)
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units WHERE code = d.code AND tenant_id = tenants.id
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Quote Comments
ALTER TABLE quote_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_comments_tenant_isolation ON quote_comments
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY quote_comments_select ON quote_comments
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY quote_comments_insert ON quote_comments
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY quote_comments_update ON quote_comments
  FOR UPDATE USING (tenant_id = get_current_tenant_id());

CREATE POLICY quote_comments_delete ON quote_comments
  FOR DELETE USING (tenant_id = get_current_tenant_id());

-- Quote Activity Logs
ALTER TABLE quote_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_activity_logs_tenant_isolation ON quote_activity_logs
  USING (tenant_id = get_current_tenant_id());

-- Quote Email Templates
ALTER TABLE quote_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_email_templates_tenant_isolation ON quote_email_templates
  USING (tenant_id = get_current_tenant_id());

-- Quote Email Queue
ALTER TABLE quote_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_email_queue_tenant_isolation ON quote_email_queue
  USING (tenant_id = get_current_tenant_id());

-- Project Resources
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_resources_tenant_isolation ON project_resources
  USING (tenant_id = get_current_tenant_id());

-- Quote Item Groups
ALTER TABLE quote_item_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_item_groups_isolation ON quote_item_groups
  USING (
    quote_id IN (
      SELECT id FROM quotes WHERE tenant_id = get_current_tenant_id()
    )
  );
