-- ============================================
-- HOLIDAYS MANAGEMENT SYSTEM
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: Public holidays with API import and pay rules
-- ============================================

-- ============================================
-- COUNTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_local TEXT,

  api_supported BOOLEAN DEFAULT true,
  api_source TEXT DEFAULT 'nager_date',

  timezone TEXT DEFAULT 'Europe/Tallinn',

  flag_emoji TEXT,
  currency TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_api_supported ON countries(api_supported);

-- Insert default countries
INSERT INTO countries (code, name, name_local, timezone, flag_emoji, currency) VALUES
  ('EE', 'Estonia', 'Eesti', 'Europe/Tallinn', '🇪🇪', 'EUR'),
  ('FI', 'Finland', 'Suomi', 'Europe/Helsinki', '🇫🇮', 'EUR'),
  ('SE', 'Sweden', 'Sverige', 'Europe/Stockholm', '🇸🇪', 'SEK'),
  ('LV', 'Latvia', 'Latvija', 'Europe/Riga', '🇱🇻', 'EUR'),
  ('LT', 'Lithuania', 'Lietuva', 'Europe/Vilnius', '🇱🇹', 'EUR'),
  ('NO', 'Norway', 'Norge', 'Europe/Oslo', '🇳🇴', 'NOK'),
  ('DK', 'Denmark', 'Danmark', 'Europe/Copenhagen', '🇩🇰', 'DKK'),
  ('DE', 'Germany', 'Deutschland', 'Europe/Berlin', '🇩🇪', 'EUR'),
  ('PL', 'Poland', 'Polska', 'Europe/Warsaw', '🇵🇱', 'PLN'),
  ('GB', 'United Kingdom', 'United Kingdom', 'Europe/London', '🇬🇧', 'GBP')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- HOLIDAYS
-- ============================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  description TEXT,

  country_code TEXT NOT NULL REFERENCES countries(code),

  type TEXT DEFAULT 'public' CHECK (type IN (
    'public',
    'bank',
    'school',
    'optional',
    'observance',
    'company'
  )),

  is_national BOOLEAN DEFAULT true,
  is_regional BOOLEAN DEFAULT false,
  regions TEXT[],

  is_work_day BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT true,

  pay_multiplier DECIMAL(4,2) DEFAULT 1.0,
  pay_type TEXT DEFAULT 'regular' CHECK (pay_type IN (
    'regular',
    'time_and_half',
    'double_time',
    'triple_time',
    'custom'
  )),

  pay_if_worked_only BOOLEAN DEFAULT false,
  min_hours_for_pay DECIMAL(4,2),

  source TEXT DEFAULT 'manual' CHECK (source IN ('api', 'manual')),
  api_id TEXT,
  api_provider TEXT,

  is_recurring BOOLEAN DEFAULT true,
  recurrence_rule TEXT,

  is_active BOOLEAN DEFAULT true,

  metadata JSONB DEFAULT '{}',
  notes TEXT,
  color TEXT DEFAULT '#3B82F6',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant ON holidays(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_country ON holidays(country_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_active ON holidays(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_date_range ON holidays(date) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_source ON holidays(source) WHERE deleted_at IS NULL;

-- ============================================
-- HOLIDAY IMPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS holiday_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  country_code TEXT NOT NULL REFERENCES countries(code),
  year INTEGER NOT NULL,

  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID,

  api_source TEXT DEFAULT 'nager_date',
  api_url TEXT,
  api_response JSONB,

  total_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  errors JSONB DEFAULT '[]',

  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),

  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_imports_tenant ON holiday_imports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_imports_country_year ON holiday_imports(country_code, year);
CREATE INDEX IF NOT EXISTS idx_imports_status ON holiday_imports(status);
CREATE INDEX IF NOT EXISTS idx_imports_imported_at ON holiday_imports(imported_at DESC);

-- ============================================
-- HOLIDAY PAY RULES (TEMPLATES)
-- ============================================
CREATE TABLE IF NOT EXISTS holiday_pay_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  applies_to_holiday_type TEXT[],
  applies_to_countries TEXT[],

  base_multiplier DECIMAL(4,2) DEFAULT 1.0,

  requires_work BOOLEAN DEFAULT false,
  min_hours_worked DECIMAL(4,2),
  max_hours_paid DECIMAL(4,2),

  has_bonus BOOLEAN DEFAULT false,
  bonus_amount DECIMAL(10,2),
  bonus_type TEXT CHECK (bonus_type IN ('fixed', 'percentage', 'hourly')),

  priority INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_rules_tenant ON holiday_pay_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_rules_active ON holiday_pay_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pay_rules_priority ON holiday_pay_rules(priority DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if date is holiday
CREATE OR REPLACE FUNCTION is_holiday(
  p_date DATE,
  p_country_code TEXT DEFAULT 'EE',
  p_tenant_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM holidays
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND date = p_date
      AND country_code = p_country_code
      AND is_active = true
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get holiday for date
CREATE OR REPLACE FUNCTION get_holiday(
  p_tenant_id UUID,
  p_date DATE,
  p_country_code TEXT DEFAULT 'EE'
) RETURNS TABLE (
  id UUID,
  name TEXT,
  name_local TEXT,
  type TEXT,
  is_work_day BOOLEAN,
  is_paid BOOLEAN,
  pay_multiplier DECIMAL,
  pay_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.name,
    h.name_local,
    h.type,
    h.is_work_day,
    h.is_paid,
    h.pay_multiplier,
    h.pay_type
  FROM holidays h
  WHERE (h.tenant_id = p_tenant_id OR h.tenant_id IS NULL)
    AND h.date = p_date
    AND h.country_code = p_country_code
    AND h.is_active = true
    AND h.deleted_at IS NULL
  ORDER BY
    CASE WHEN h.tenant_id IS NOT NULL THEN 1 ELSE 2 END,
    h.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate holiday pay
CREATE OR REPLACE FUNCTION calculate_holiday_pay(
  p_base_hourly_rate DECIMAL,
  p_hours_worked DECIMAL,
  p_holiday_multiplier DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(p_base_hourly_rate * p_hours_worked * p_holiday_multiplier, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get holidays for date range
CREATE OR REPLACE FUNCTION get_holidays_for_range(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_country_code TEXT DEFAULT 'EE'
) RETURNS TABLE (
  date DATE,
  name TEXT,
  name_local TEXT,
  type TEXT,
  is_work_day BOOLEAN,
  pay_multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.date,
    h.name,
    h.name_local,
    h.type,
    h.is_work_day,
    h.pay_multiplier
  FROM holidays h
  WHERE (h.tenant_id = p_tenant_id OR h.tenant_id IS NULL)
    AND h.country_code = p_country_code
    AND h.date >= p_start_date
    AND h.date <= p_end_date
    AND h.is_active = true
    AND h.deleted_at IS NULL
  ORDER BY h.date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get upcoming holidays
CREATE OR REPLACE FUNCTION get_upcoming_holidays(
  p_tenant_id UUID,
  p_country_code TEXT DEFAULT 'EE',
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  date DATE,
  name TEXT,
  name_local TEXT,
  type TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.date,
    h.name,
    h.name_local,
    h.type,
    (h.date - CURRENT_DATE)::INTEGER as days_until
  FROM holidays h
  WHERE (h.tenant_id = p_tenant_id OR h.tenant_id IS NULL)
    AND h.country_code = p_country_code
    AND h.date >= CURRENT_DATE
    AND h.is_active = true
    AND h.deleted_at IS NULL
  ORDER BY h.date
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VIEWS
-- ============================================

-- Upcoming holidays view
CREATE OR REPLACE VIEW v_upcoming_holidays AS
SELECT
  h.id,
  h.tenant_id,
  h.date,
  h.name,
  h.name_local,
  h.description,
  h.type,
  h.country_code,
  c.name as country_name,
  c.name_local as country_name_local,
  c.flag_emoji,
  h.is_work_day,
  h.is_paid,
  h.pay_multiplier,
  h.pay_type,
  h.color,
  EXTRACT(DOW FROM h.date) as day_of_week,
  TO_CHAR(h.date, 'Day') as day_name,
  TO_CHAR(h.date, 'DD.MM.YYYY') as formatted_date,
  (h.date - CURRENT_DATE)::INTEGER as days_until,
  h.notes
FROM holidays h
JOIN countries c ON h.country_code = c.code
WHERE h.date >= CURRENT_DATE
  AND h.is_active = true
  AND h.deleted_at IS NULL
ORDER BY h.date ASC;

-- Current year holidays view
CREATE OR REPLACE VIEW v_current_year_holidays AS
SELECT
  h.id,
  h.tenant_id,
  h.date,
  h.name,
  h.name_local,
  h.type,
  h.country_code,
  c.name as country_name,
  c.flag_emoji,
  h.is_work_day,
  h.is_paid,
  h.pay_multiplier,
  h.pay_type,
  h.color,
  EXTRACT(DOW FROM h.date) as day_of_week,
  EXTRACT(WEEK FROM h.date) as week_number,
  TO_CHAR(h.date, 'Mon') as month_abbr,
  TO_CHAR(h.date, 'DD.MM.YYYY') as formatted_date,
  h.source,
  h.notes
FROM holidays h
JOIN countries c ON h.country_code = c.code
WHERE EXTRACT(YEAR FROM h.date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND h.is_active = true
  AND h.deleted_at IS NULL
ORDER BY h.date;

-- Holiday calendar view (for calendar components)
CREATE OR REPLACE VIEW v_holiday_calendar AS
SELECT
  h.date,
  h.name,
  h.name_local,
  h.type,
  h.country_code,
  h.color,
  h.is_work_day,
  EXTRACT(YEAR FROM h.date) as year,
  EXTRACT(MONTH FROM h.date) as month,
  EXTRACT(DAY FROM h.date) as day,
  TO_CHAR(h.date, 'YYYY-MM-DD') as iso_date
FROM holidays h
WHERE h.is_active = true
  AND h.deleted_at IS NULL;

-- ============================================
-- SAMPLE DATA - Estonia 2024-2025 holidays
-- ============================================
INSERT INTO holidays (tenant_id, date, name, name_local, country_code, type, is_work_day, pay_multiplier, source, color) VALUES
  -- 2024
  (NULL, '2024-01-01', 'New Year''s Day', 'Uusaasta', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2024-02-24', 'Independence Day', 'Iseseisvuspäev', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2024-03-29', 'Good Friday', 'Suur reede', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2024-03-31', 'Easter Sunday', 'Ülestõusmispühade 1. püha', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2024-05-01', 'Spring Day', 'Kevadpüha', 'EE', 'public', false, 1.0, 'manual', '#10B981'),
  (NULL, '2024-05-19', 'Pentecost', 'Nelipühade 1. püha', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2024-06-23', 'Victory Day', 'Võidupüha', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2024-06-24', 'Midsummer Day', 'Jaanipäev', 'EE', 'public', false, 1.0, 'manual', '#F59E0B'),
  (NULL, '2024-08-20', 'Day of Restoration of Independence', 'Taasiseseisvumispäev', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2024-12-24', 'Christmas Eve', 'Jõululaupäev', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2024-12-25', 'Christmas Day', 'Esimene jõulupüha', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2024-12-26', 'Boxing Day', 'Teine jõulupüha', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  -- 2025
  (NULL, '2025-01-01', 'New Year''s Day', 'Uusaasta', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2025-02-24', 'Independence Day', 'Iseseisvuspäev', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2025-04-18', 'Good Friday', 'Suur reede', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2025-04-20', 'Easter Sunday', 'Ülestõusmispühade 1. püha', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2025-05-01', 'Spring Day', 'Kevadpüha', 'EE', 'public', false, 1.0, 'manual', '#10B981'),
  (NULL, '2025-06-08', 'Pentecost', 'Nelipühade 1. püha', 'EE', 'public', false, 1.0, 'manual', '#8B5CF6'),
  (NULL, '2025-06-23', 'Victory Day', 'Võidupüha', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2025-06-24', 'Midsummer Day', 'Jaanipäev', 'EE', 'public', false, 1.0, 'manual', '#F59E0B'),
  (NULL, '2025-08-20', 'Day of Restoration of Independence', 'Taasiseseisvumispäev', 'EE', 'public', false, 1.0, 'manual', '#3B82F6'),
  (NULL, '2025-12-24', 'Christmas Eve', 'Jõululaupäev', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2025-12-25', 'Christmas Day', 'Esimene jõulupüha', 'EE', 'public', false, 1.0, 'manual', '#EF4444'),
  (NULL, '2025-12-26', 'Boxing Day', 'Teine jõulupüha', 'EE', 'public', false, 1.0, 'manual', '#EF4444')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holiday_pay_rules_updated_at BEFORE UPDATE ON holiday_pay_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE countries IS 'Supported countries for holiday import';
COMMENT ON TABLE holidays IS 'Public holidays with pay calculation rules';
COMMENT ON TABLE holiday_imports IS 'History of automated holiday imports from external APIs';
COMMENT ON TABLE holiday_pay_rules IS 'Pay calculation rule templates for different holiday types';

COMMENT ON COLUMN holidays.pay_multiplier IS 'Pay multiplier: 1.0 = normal, 1.5 = time and half, 2.0 = double time';
COMMENT ON COLUMN holidays.is_work_day IS 'If true, employees are expected to work (e.g., observance days)';
COMMENT ON COLUMN holidays.source IS 'Origin of holiday data: api = imported, manual = created by user';
COMMENT ON COLUMN holidays.tenant_id IS 'NULL = global holiday visible to all tenants, UUID = tenant-specific';
