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
  code TEXT NOT NULL UNIQUE, -- 'EE', 'FI', 'SE', etc.
  name TEXT NOT NULL,
  name_local TEXT,
  
  -- API settings
  api_supported BOOLEAN DEFAULT true,
  api_source TEXT DEFAULT 'nager_date',
  
  -- Timezone
  timezone TEXT DEFAULT 'Europe/Tallinn',
  
  -- Metadata
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
  
  -- Basic info
  date DATE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  description TEXT,
  
  -- Country
  country_code TEXT NOT NULL REFERENCES countries(code),
  
  -- Type
  type TEXT DEFAULT 'public' CHECK (type IN (
    'public',        -- Riiklik püha
    'bank',          -- Panga püha
    'school',        -- Koolipüha
    'optional',      -- Valikuline
    'observance',    -- Tähtpäev (not work-free)
    'company'        -- Ettevõtte oma püha
  )),
  
  -- Scope
  is_national BOOLEAN DEFAULT true,
  is_regional BOOLEAN DEFAULT false,
  regions TEXT[], -- ['Harjumaa', 'Tartumaa']
  
  -- Work day settings
  is_work_day BOOLEAN DEFAULT false, -- Kas tööpäev
  is_paid BOOLEAN DEFAULT true, -- Kas tasustatakse
  
  -- Pay rules
  pay_multiplier DECIMAL(4,2) DEFAULT 1.0, -- 1.0 = normal, 1.5 = time and half, 2.0 = double
  pay_type TEXT DEFAULT 'regular' CHECK (pay_type IN (
    'regular',       -- Tavaline palk
    'time_and_half', -- 1.5x
    'double_time',   -- 2.0x
    'triple_time',   -- 3.0x (rare)
    'custom'         -- Kohandatud
  )),
  
  -- Additional pay settings
  pay_if_worked_only BOOLEAN DEFAULT false, -- Pay extra only if actually worked
  min_hours_for_pay DECIMAL(4,2), -- Minimum hours to qualify
  
  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('api', 'manual')),
  api_id TEXT, -- External API ID
  api_provider TEXT, -- 'nager_date', 'calendarific', etc.
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT true,
  recurrence_rule TEXT, -- 'YEARLY', 'FIXED:01-01', 'EASTER+50' (nelipüha)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ,
  
  -- Unique constraint: same holiday can't be on same date for same country in same tenant
  CONSTRAINT unique_holiday_per_tenant_date_country 
    UNIQUE(tenant_id, date, country_code, name)
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant ON holidays(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_country ON holidays(country_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_active ON holidays(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_date_range ON holidays(date) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_source ON holidays(source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(EXTRACT(YEAR FROM date)) WHERE deleted_at IS NULL;

-- ============================================
-- HOLIDAY IMPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS holiday_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  country_code TEXT NOT NULL REFERENCES countries(code),
  year INTEGER NOT NULL,
  
  -- Import details
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES user_profiles(id),
  
  api_source TEXT DEFAULT 'nager_date',
  api_url TEXT,
  api_response JSONB,
  
  -- Results
  total_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  errors JSONB DEFAULT '[]',
  
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
  
  -- Duration
  duration_ms INTEGER,
  
  CONSTRAINT unique_import_per_tenant_country_year 
    UNIQUE(tenant_id, country_code, year, imported_at)
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
  
  -- Rule applies to
  applies_to_holiday_type TEXT[], -- ['public', 'bank']
  applies_to_countries TEXT[], -- ['EE', 'FI'], NULL = all
  
  -- Pay calculation
  base_multiplier DECIMAL(4,2) DEFAULT 1.0,
  
  -- Conditions
  requires_work BOOLEAN DEFAULT false, -- Apply only if employee actually works
  min_hours_worked DECIMAL(4,2), -- Minimum hours to qualify
  max_hours_paid DECIMAL(4,2), -- Maximum hours to pay at multiplier
  
  -- Additional bonuses
  has_bonus BOOLEAN DEFAULT false,
  bonus_amount DECIMAL(10,2),
  bonus_type TEXT CHECK (bonus_type IN ('fixed', 'percentage', 'hourly')),
  
  -- Priority (higher = applies first if multiple rules match)
  priority INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_rule_name_per_tenant UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_pay_rules_tenant ON holiday_pay_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_rules_active ON holiday_pay_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pay_rules_priority ON holiday_pay_rules(priority DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if date is holiday
CREATE OR REPLACE FUNCTION is_holiday(
  p_tenant_id UUID,
  p_date DATE,
  p_country_code TEXT DEFAULT 'EE'
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
    CASE WHEN h.tenant_id IS NOT NULL THEN 1 ELSE 2 END, -- Tenant-specific first
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

-- Count holidays in year
CREATE OR REPLACE FUNCTION count_holidays_in_year(
  p_tenant_id UUID,
  p_year INTEGER,
  p_country_code TEXT DEFAULT 'EE'
) RETURNS INTEGER AS $$
DECLARE
  holiday_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO holiday_count
  FROM holidays
  WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND country_code = p_country_code
    AND EXTRACT(YEAR FROM date) = p_year
    AND is_active = true
    AND deleted_at IS NULL;
  
  RETURN holiday_count;
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

COMMENT ON VIEW v_upcoming_holidays IS 'Upcoming holidays with calculated fields';

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

COMMENT ON VIEW v_current_year_holidays IS 'Holidays for current year';

-- Holiday statistics view
CREATE OR REPLACE VIEW v_holiday_stats AS
SELECT 
  h.tenant_id,
  h.country_code,
  c.name as country_name,
  EXTRACT(YEAR FROM h.date) as year,
  h.type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE h.is_work_day = false) as non_work_days,
  COUNT(*) FILTER (WHERE h.is_paid = true) as paid_days,
  COUNT(*) FILTER (WHERE h.pay_multiplier > 1.0) as premium_pay_days,
  AVG(h.pay_multiplier) as avg_multiplier,
  MIN(h.date) as first_holiday,
  MAX(h.date) as last_holiday
FROM holidays h
JOIN countries c ON h.country_code = c.code
WHERE h.is_active = true
  AND h.deleted_at IS NULL
GROUP BY h.tenant_id, h.country_code, c.name, EXTRACT(YEAR FROM h.date), h.type;

COMMENT ON VIEW v_holiday_stats IS 'Holiday statistics by country, year and type';

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

COMMENT ON VIEW v_holiday_calendar IS 'Holiday calendar data optimized for calendar components';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_pay_rules ENABLE ROW LEVEL SECURITY;

-- Holidays: tenant policy (includes global holidays)
CREATE POLICY holidays_tenant_policy ON holidays
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id', true)::UUID
    OR tenant_id IS NULL -- Global holidays visible to all
  );

-- Holiday imports: tenant policy
CREATE POLICY holiday_imports_tenant_policy ON holiday_imports
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Holiday pay rules: tenant policy
CREATE POLICY holiday_pay_rules_tenant_policy ON holiday_pay_rules
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id', true)::UUID
    OR tenant_id IS NULL
  );

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Estonia 2024 public holidays (manual backup if API fails)
INSERT INTO holidays (tenant_id, date, name, name_local, country_code, type, is_work_day, pay_multiplier, source, color) VALUES
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
  (NULL, '2024-12-26', 'Boxing Day', 'Teine jõulupüha', 'EE', 'public', false, 1.0, 'manual', '#EF4444')
ON CONFLICT DO NOTHING;

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
