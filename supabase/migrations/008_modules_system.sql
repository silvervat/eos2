-- ═══════════════════════════════════════════════════════════════════════════
-- EOS2 MODULES SYSTEM
-- Modulaarse arhitektuuri baastabelid
-- ═══════════════════════════════════════════════════════════════════════════
-- Autor: Claude Code
-- Kuupäev: 2025-12-04
-- Versioon: 1.0.0
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: modules
-- Moodulite register - iga moodul on siin registreeritud
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifikaator
  name TEXT UNIQUE NOT NULL,              -- vehicles, projects, invoices (lowercase)

  -- Nimed
  label TEXT NOT NULL,                    -- Sõidukid, Projektid, Arved
  label_singular TEXT NOT NULL,           -- Sõiduk, Projekt, Arve

  -- UI
  icon TEXT,                              -- CarOutlined, ProjectOutlined
  description TEXT,                       -- Mooduli kirjeldus

  -- Staatus
  status TEXT NOT NULL DEFAULT 'development'
    CHECK (status IN ('active', 'beta', 'development', 'todo', 'disabled')),

  -- Konfiguratsioon (täielik definition.ts sisu JSON-ina)
  config JSONB NOT NULL DEFAULT '{}',

  -- Menüü seaded
  menu_group TEXT,                        -- warehouse, finance, admin
  menu_order INTEGER DEFAULT 0,           -- Järjekord menüüs
  menu_visible BOOLEAN DEFAULT true,      -- Kas nähtav menüüs

  -- Meta
  version TEXT DEFAULT '1.0.0',
  author TEXT,

  -- Bugid ja TODO-d
  bug_refs TEXT[] DEFAULT '{}',           -- ['#BUG-123', '#BUG-456']
  todo_refs TEXT[] DEFAULT '{}',          -- ['#TODO-045', '#TODO-112']

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_menu_group ON modules(menu_group);
CREATE INDEX IF NOT EXISTS idx_modules_menu_order ON modules(menu_order);

-- Kommentaar
COMMENT ON TABLE modules IS 'EOS2 moodulite register - iga moodul on siin registreeritud';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: components
-- Komponentide register - iga komponendi staatus ja seosed
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seos mooduliga
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,

  -- Identifikaator
  name TEXT NOT NULL,                     -- VehicleList, VehicleForm

  -- Tüüp
  type TEXT NOT NULL                      -- page, modal, widget, tab, card
    CHECK (type IN ('page', 'modal', 'widget', 'tab', 'card', 'form', 'table', 'other')),

  -- Staatus
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('active', 'beta', 'development', 'todo', 'deprecated')),

  -- Info
  description TEXT,
  file_path TEXT,                         -- components/VehicleList.tsx

  -- Bugid ja TODO-d
  bug_refs TEXT[] DEFAULT '{}',
  todo_refs TEXT[] DEFAULT '{}',

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unikaalsus
  UNIQUE(module_name, name)
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_components_module ON components(module_name);
CREATE INDEX IF NOT EXISTS idx_components_status ON components(status);
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);

-- Kommentaar
COMMENT ON TABLE components IS 'EOS2 komponentide register - iga komponendi staatus ja seosed';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: module_actions
-- Toimingute register - iga mooduli võimalikud toimingud
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS module_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seos mooduliga
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,

  -- Toiming
  action TEXT NOT NULL,                   -- read, create, update, delete, export

  -- Nimed
  label TEXT NOT NULL,                    -- Vaata, Lisa, Muuda, Kustuta, Eksport
  description TEXT,                       -- Pikema kirjeldus

  -- Vaikimisi rollid kellel on see õigus
  default_roles TEXT[] NOT NULL DEFAULT '{}', -- ['manager', 'admin', 'owner']

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unikaalsus
  UNIQUE(module_name, action)
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_module_actions_module ON module_actions(module_name);
CREATE INDEX IF NOT EXISTS idx_module_actions_action ON module_actions(action);

-- Kommentaar
COMMENT ON TABLE module_actions IS 'EOS2 moodulite toimingute register';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: roles
-- Rollide definitsioonid
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifikaator
  name TEXT UNIQUE NOT NULL,              -- owner, admin, manager, user, viewer

  -- Nimed
  label TEXT NOT NULL,                    -- Omanik, Administraator, Juhataja
  description TEXT,                       -- Pikema kirjeldus

  -- Hierarhia (kõrgem number = rohkem õigusi)
  level INTEGER NOT NULL DEFAULT 0,       -- owner=100, admin=80, manager=60, user=40, viewer=20

  -- Värvid UI jaoks
  color TEXT,                             -- #52c41a

  -- Kas süsteemi roll (ei saa kustutada)
  is_system BOOLEAN DEFAULT false,

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kommentaar
COMMENT ON TABLE roles IS 'EOS2 rollide definitsioonid';

-- Lisa vaikimisi rollid
INSERT INTO roles (name, label, description, level, color, is_system) VALUES
  ('owner', 'Omanik', 'Täielik ligipääs kõigile süsteemidele ja seadetele', 100, '#722ed1', true),
  ('admin', 'Administraator', 'Haldab kasutajaid, mooduleid ja õigusi', 80, '#1890ff', true),
  ('manager', 'Juhataja', 'Haldab projekte, arveid ja ressursse', 60, '#52c41a', true),
  ('user', 'Kasutaja', 'Tavakasutaja - põhiõigused', 40, '#faad14', true),
  ('viewer', 'Vaataja', 'Vaataja - ainult lugemisõigus', 20, '#8c8c8c', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: user_module_access
-- Kasutaja ligipääsud moodulitele
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seosed
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,

  -- Õigused (millised toimingud on lubatud)
  permissions TEXT[] NOT NULL DEFAULT '{}', -- ['read', 'create', 'update']

  -- Seaded
  visible_in_menu BOOLEAN DEFAULT true,     -- Kas nähtav menüüs
  is_favorite BOOLEAN DEFAULT false,        -- Kas lemmik
  custom_order INTEGER,                     -- Kohandatud järjekord

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unikaalsus
  UNIQUE(user_id, module_name)
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_user_module_access_user ON user_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_access_module ON user_module_access(module_name);

-- Kommentaar
COMMENT ON TABLE user_module_access IS 'Kasutaja ligipääsud moodulitele';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: user_component_access
-- Kasutaja ligipääsud komponentidele (granular control)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_component_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seosed
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,

  -- Seaded
  visible BOOLEAN DEFAULT true,             -- Kas nähtav
  readonly BOOLEAN DEFAULT false,           -- Kas ainult lugemiseks

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unikaalsus
  UNIQUE(user_id, component_id)
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_user_component_access_user ON user_component_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_component_access_component ON user_component_access(component_id);

-- Kommentaar
COMMENT ON TABLE user_component_access IS 'Kasutaja ligipääsud komponentidele';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABEL: module_relations
-- Moodulite vahelised seosed
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS module_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seosed
  source_module TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,
  target_module TEXT NOT NULL REFERENCES modules(name) ON DELETE CASCADE,

  -- Seose tüüp
  relation_type TEXT NOT NULL              -- one-to-one, one-to-many, many-to-many
    CHECK (relation_type IN ('one-to-one', 'one-to-many', 'many-to-one', 'many-to-many')),

  -- Välisvõti info
  foreign_key TEXT,                        -- current_project_id
  label TEXT,                              -- "Praegune projekt"

  -- Timestampid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unikaalsus
  UNIQUE(source_module, target_module, foreign_key)
);

-- Indeksid
CREATE INDEX IF NOT EXISTS idx_module_relations_source ON module_relations(source_module);
CREATE INDEX IF NOT EXISTS idx_module_relations_target ON module_relations(target_module);

-- Kommentaar
COMMENT ON TABLE module_relations IS 'Moodulite vahelised seosed';

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNKTSIOON: update_updated_at_column
-- Automaatne updated_at uuendamine
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggerid updated_at jaoks
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_actions_updated_at
  BEFORE UPDATE ON module_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_module_access_updated_at
  BEFORE UPDATE ON user_module_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_component_access_updated_at
  BEFORE UPDATE ON user_component_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNKTSIOON: get_user_permissions
-- Tagastab kasutaja õigused konkreetse mooduli jaoks
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_module_name TEXT
)
RETURNS TEXT[] AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  SELECT permissions INTO v_permissions
  FROM user_module_access
  WHERE user_id = p_user_id AND module_name = p_module_name;

  RETURN COALESCE(v_permissions, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNKTSIOON: has_permission
-- Kontrollib kas kasutajal on konkreetne õigus
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_module_name TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  v_permissions := get_user_permissions(p_user_id, p_module_name);
  RETURN p_action = ANY(v_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNKTSIOON: get_user_role_level
-- Tagastab kasutaja rolli taseme
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_role_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_role TEXT;
  v_level INTEGER;
BEGIN
  -- Eelda et kasutaja roll on users tabelis või profiili tabelis
  -- Siin tuleb kohandada vastavalt teie andmebaasi struktuurile
  SELECT COALESCE(raw_user_meta_data->>'role', 'viewer') INTO v_role
  FROM auth.users
  WHERE id = p_user_id;

  SELECT level INTO v_level
  FROM roles
  WHERE name = v_role;

  RETURN COALESCE(v_level, 20); -- Vaikimisi viewer tase
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- LISA NÄIDIS MOODUL: warehouse (juba olemas)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO modules (name, label, label_singular, icon, description, status, menu_group, menu_order, version, author)
VALUES (
  'warehouse',
  'Laohaldus',
  'Ladu',
  'DatabaseOutlined',
  'Varade, laoseisu ja ülekannete haldus',
  'active',
  'warehouse',
  10,
  '1.0.0',
  'Silver'
)
ON CONFLICT (name) DO UPDATE SET
  label = EXCLUDED.label,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Warehouse mooduli toimingud
INSERT INTO module_actions (module_name, action, label, description, default_roles) VALUES
  ('warehouse', 'read', 'Vaata', 'Varade ja laoseisu vaatamine', ARRAY['viewer', 'user', 'manager', 'admin', 'owner']),
  ('warehouse', 'create', 'Lisa', 'Uute varade lisamine', ARRAY['manager', 'admin', 'owner']),
  ('warehouse', 'update', 'Muuda', 'Varade andmete muutmine', ARRAY['manager', 'admin', 'owner']),
  ('warehouse', 'delete', 'Kustuta', 'Varade kustutamine', ARRAY['admin', 'owner']),
  ('warehouse', 'transfer', 'Ülekanne', 'Varade ülekandmine', ARRAY['user', 'manager', 'admin', 'owner']),
  ('warehouse', 'export', 'Eksport', 'Andmete eksportimine', ARRAY['manager', 'admin', 'owner'])
ON CONFLICT (module_name, action) DO NOTHING;

-- Warehouse mooduli komponendid
INSERT INTO components (module_name, name, type, status, description, file_path) VALUES
  ('warehouse', 'AssetsTable', 'table', 'active', 'Varade tabel filtritega', 'components/warehouse/AssetsTable.tsx'),
  ('warehouse', 'WarehouseStats', 'widget', 'active', 'Statistika kaardid', 'components/warehouse/WarehouseStats.tsx'),
  ('warehouse', 'LowStockAlerts', 'widget', 'active', 'Madala laoseisu hoiatused', 'components/warehouse/LowStockAlerts.tsx'),
  ('warehouse', 'StockMovements', 'widget', 'active', 'Laoseisu liikumised', 'components/warehouse/StockMovements.tsx'),
  ('warehouse', 'PhotoGallery', 'widget', 'active', 'Fotogalerii', 'components/warehouse/PhotoGallery.tsx'),
  ('warehouse', 'QRCodeModal', 'modal', 'active', 'QR koodi genereerimine', 'components/warehouse/QRCodeModal.tsx'),
  ('warehouse', 'AssetForm', 'form', 'active', 'Vara lisamise/muutmise vorm', 'components/warehouse/AssetForm.tsx'),
  ('warehouse', 'TransferForm', 'form', 'active', 'Ülekande vorm', 'components/warehouse/TransferForm.tsx')
ON CONFLICT (module_name, name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- VALMIS!
-- ═══════════════════════════════════════════════════════════════════════════

-- Kontrollpäringud (kommenteeritud):
-- SELECT * FROM modules;
-- SELECT * FROM components WHERE module_name = 'warehouse';
-- SELECT * FROM module_actions WHERE module_name = 'warehouse';
-- SELECT * FROM roles;
