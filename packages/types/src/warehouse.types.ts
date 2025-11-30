// =============================================
// WAREHOUSE MANAGEMENT TYPES
// =============================================

// Warehouse Types
export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  type: WarehouseType;
  location?: string;
  address?: string;
  manager_id?: string;
  contact_phone?: string;
  contact_email?: string;
  capacity_m3?: number;
  temperature_controlled: boolean;
  security_level: SecurityLevel;
  access_hours?: string;
  notes?: string;
  metadata: Record<string, any>;
  settings: WarehouseSettings;
  status: WarehouseStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  manager?: UserProfile;
  assets?: Asset[];
  locations?: WarehouseLocation[];
}

export type WarehouseType = 'main' | 'mobile' | 'external' | 'vehicle';
export type WarehouseStatus = 'active' | 'inactive' | 'maintenance';
export type SecurityLevel = 'low' | 'standard' | 'high' | 'maximum';

export interface WarehouseSettings {
  location_system?: {
    enabled: boolean;
    levels: string[];
  };
  photo_requirements?: {
    check_in: boolean;
    check_out: boolean;
    damage: boolean;
  };
  inventory?: {
    cycle_count_enabled: boolean;
    variance_threshold: number;
  };
}

// Asset Category Types
export interface AssetCategory {
  id: string;
  tenant_id: string;
  parent_id?: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  path: string;
  level: number;
  order_index: number;
  requires_maintenance: boolean;
  maintenance_interval_days?: number;
  is_consumable: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  parent?: AssetCategory;
  children?: AssetCategory[];
}

// Asset Types
export interface Asset {
  id: string;
  tenant_id: string;
  category_id?: string;

  // Identification
  asset_code: string;
  barcode?: string;
  qr_code?: string;
  serial_number?: string;

  // Basic info
  name: string;
  model?: string;
  manufacturer?: string;
  description?: string;
  keywords?: string[];

  // Type and status
  type: AssetType;
  status: AssetStatus;
  condition: AssetCondition;

  // Location
  current_warehouse_id?: string;
  current_location_id?: string;
  current_location?: string;

  // Assignment
  assigned_to_user_id?: string;
  assigned_to_project_id?: string;
  assigned_at?: string;

  // Pricing
  purchase_price?: number;
  current_value?: number;
  average_price?: number;
  currency: string;

  // Consumable fields
  is_consumable: boolean;
  quantity_available?: number;
  quantity_reserved?: number;
  quantity_unit: QuantityUnit;
  min_quantity?: number;
  max_quantity?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  unit_weight_kg?: number;
  weight_tolerance_percent?: number;

  // Maintenance
  requires_maintenance: boolean;
  maintenance_interval_days?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_notes?: string;

  // Rental
  is_rental: boolean;
  rental_start_date?: string;
  rental_end_date?: string;
  rental_company?: string;
  rental_contract_number?: string;
  rental_monthly_cost?: number;
  rental_deposit?: number;

  // Insurance
  is_insured: boolean;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_value?: number;
  insurance_expires_at?: string;

  // Dates
  purchase_date?: string;
  warranty_expires_at?: string;
  acquisition_date?: string;
  retirement_date?: string;

  // Other
  dimensions?: string;
  weight_kg?: number;
  color?: string;
  notes?: string;
  defects?: AssetDefect[];
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  category?: AssetCategory;
  warehouse?: Warehouse;
  location?: WarehouseLocation;
  assigned_user?: UserProfile;
  assigned_project?: Project;
  photos?: AssetPhoto[];
  transfers?: AssetTransfer[];
  maintenances?: AssetMaintenance[];
  relations?: AssetRelation[];
}

export type AssetType = 'asset' | 'consumable' | 'tool';
export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'rented' | 'retired' | 'lost' | 'damaged';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type QuantityUnit = 'tk' | 'kg' | 'l' | 'm' | 'm2' | 'm3' | 'pcs' | 'box' | 'pallet';

export interface AssetDefect {
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  reported_at: string;
  reported_by: string;
  photos?: string[];
}

// Warehouse Location Types
export interface WarehouseLocation {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  parent_id?: string;

  code: string;
  name: string;
  type: LocationType;

  path: string;
  level: number;

  capacity?: number;
  current_count: number;

  barcode?: string;
  qr_code?: string;

  dimensions?: string;
  notes?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  warehouse?: Warehouse;
  parent?: WarehouseLocation;
  children?: WarehouseLocation[];
  assets?: Asset[];
}

export type LocationType = 'zone' | 'room' | 'shelf' | 'row' | 'bin';

// Asset Photo Types
export interface AssetPhoto {
  id: string;
  tenant_id: string;
  asset_id: string;

  file_url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  width?: number;
  height?: number;

  photo_type: PhotoType;
  category?: PhotoCategory;

  taken_at: string;
  taken_by_user_id?: string;
  location?: string;
  location_id?: string;
  transfer_id?: string;

  title?: string;
  description?: string;
  tags?: string[];
  is_primary: boolean;

  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  device_info?: {
    model?: string;
    os?: string;
  };

  metadata: Record<string, any>;
  created_at: string;
  deleted_at?: string;

  // Relations
  asset?: Asset;
  taken_by?: UserProfile;
}

export type PhotoType = 'general' | 'check_in' | 'check_out' | 'damage' | 'repair' | 'maintenance';
export type PhotoCategory = 'before' | 'after' | 'damage' | 'current';

// Asset Transfer Types
export interface AssetTransfer {
  id: string;
  tenant_id: string;
  transfer_number: string;

  asset_id: string;
  quantity: number;

  // Source and destination
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  from_project_id?: string;
  to_project_id?: string;

  // Status and type
  status: TransferStatus;
  transfer_type: TransferType;

  // Dates
  requested_at: string;
  requested_by_user_id: string;
  approved_at?: string;
  approved_by_user_id?: string;
  shipped_at?: string;
  delivered_at?: string;
  expected_return_date?: string;

  // Photos and condition
  check_out_photos?: string[];
  check_in_photos?: string[];
  condition_before?: string;
  condition_after?: string;

  // Other
  notes?: string;
  reason?: string;
  rejection_reason?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  asset?: Asset;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  from_user?: UserProfile;
  to_user?: UserProfile;
  from_project?: Project;
  to_project?: Project;
  requested_by?: UserProfile;
  approved_by?: UserProfile;
}

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'delivered' | 'rejected' | 'cancelled';
export type TransferType = 'warehouse' | 'user' | 'project' | 'rental_out' | 'rental_return';

// Asset Maintenance Types
export interface AssetMaintenance {
  id: string;
  tenant_id: string;
  asset_id: string;

  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;

  scheduled_date: string;
  completed_date?: string;
  due_date?: string;

  performed_by_user_id?: string;
  performed_by_company?: string;

  // Costs
  cost?: number;
  labor_cost?: number;
  parts_cost?: number;
  external_service_cost?: number;
  other_costs?: number;
  total_cost?: number;

  invoice_number?: string;

  description?: string;
  work_performed?: string;
  parts_replaced?: string;
  issues_found?: string;
  recommendations?: string;

  next_maintenance_date?: string;
  next_maintenance_type?: string;

  photos?: string[];
  documents?: string[];

  cost_items?: MaintenanceCostItem[];

  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  asset?: Asset;
  performed_by?: UserProfile;
}

export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'calibration' | 'certification';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

export interface MaintenanceCostItem {
  id: string;
  maintenance_id: string;

  item_type: 'labor' | 'part' | 'service' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;

  supplier_id?: string;
  invoice_number?: string;
  invoice_date?: string;

  created_at: string;
}

// Asset Relation Types
export interface AssetRelation {
  id: string;
  tenant_id: string;

  parent_asset_id: string;
  child_asset_id: string;

  relation_type: RelationType;

  quantity: number;
  is_required: boolean;
  auto_transfer: boolean;

  notes?: string;
  created_at: string;

  // Relations
  parent_asset?: Asset;
  child_asset?: Asset;
}

export type RelationType = 'component' | 'accessory' | 'compatible' | 'alternative';

// Stock Movement Types
export interface StockMovement {
  id: string;
  tenant_id: string;
  asset_id: string;
  warehouse_id: string;

  movement_type: MovementType;
  quantity: number;
  quantity_before?: number;
  quantity_after?: number;

  reference_type?: ReferenceType;
  reference_id?: string;

  user_id?: string;
  project_id?: string;

  reason?: string;
  notes?: string;

  created_at: string;

  // Relations
  asset?: Asset;
  warehouse?: Warehouse;
  user?: UserProfile;
  project?: Project;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'lost' | 'found' | 'damaged';
export type ReferenceType = 'purchase' | 'transfer' | 'project' | 'maintenance' | 'disposal' | 'initial';

// Asset Reminder Types
export interface AssetReminder {
  id: string;
  tenant_id: string;

  reminder_type: ReminderType;
  status: ReminderStatus;
  priority: ReminderPriority;

  asset_id?: string;
  category_id?: string;

  title: string;
  message?: string;

  due_date?: string;
  remind_at?: string;
  snoozed_until?: string;

  notify_users?: string[];
  notification_sent: boolean;
  last_notification_at?: string;

  action_url?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  completed_at?: string;
  deleted_at?: string;

  // Relations
  asset?: Asset;
  category?: AssetCategory;
}

export type ReminderType = 'maintenance' | 'insurance_expiry' | 'warranty_expiry' | 'rental_end' | 'low_stock' | 'return_overdue';
export type ReminderStatus = 'active' | 'snoozed' | 'completed' | 'dismissed';
export type ReminderPriority = 'low' | 'normal' | 'high' | 'critical';

// Inventory Count Types
export interface InventoryCount {
  id: string;
  tenant_id: string;
  warehouse_id: string;

  count_number: string;
  count_type: CountType;
  status: CountStatus;

  planned_date?: string;
  started_at?: string;
  completed_at?: string;

  responsible_user_id?: string;

  // Scope
  location_ids?: string[];
  category_ids?: string[];

  // Results
  total_items_expected?: number;
  total_items_counted?: number;
  total_items_matched?: number;
  total_items_variance?: number;
  variance_value?: number;

  notes?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  warehouse?: Warehouse;
  responsible_user?: UserProfile;
  items?: InventoryCountItem[];
}

export type CountType = 'full' | 'partial' | 'cycle' | 'spot';
export type CountStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface InventoryCountItem {
  id: string;
  count_id: string;
  asset_id: string;

  expected_quantity?: number;
  expected_location_id?: string;

  counted_quantity?: number;
  counted_location_id?: string;

  variance?: number;
  variance_percent?: number;

  status: CountItemStatus;

  counted_at?: string;
  counted_by_user_id?: string;

  photos?: string[];
  notes?: string;

  created_at: string;

  // Relations
  asset?: Asset;
  expected_location?: WarehouseLocation;
  counted_location?: WarehouseLocation;
  counted_by?: UserProfile;
}

export type CountItemStatus = 'pending' | 'counted' | 'verified' | 'adjusted';

// Warehouse Order Types
export interface WarehouseOrder {
  id: string;
  tenant_id: string;
  order_number: string;

  order_type: OrderType;
  status: OrderStatus;

  warehouse_id?: string;
  supplier_id?: string;

  requested_by_user_id?: string;
  approved_by_user_id?: string;

  total_amount?: number;
  currency: string;

  expected_delivery_date?: string;
  actual_delivery_date?: string;

  notes?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  warehouse?: Warehouse;
  supplier?: Company;
  requested_by?: UserProfile;
  approved_by?: UserProfile;
  items?: WarehouseOrderItem[];
}

export type OrderType = 'purchase' | 'replenishment' | 'emergency';
export type OrderStatus = 'draft' | 'submitted' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface WarehouseOrderItem {
  id: string;
  order_id: string;
  asset_id: string;

  quantity_ordered: number;
  quantity_received: number;

  unit_price?: number;
  total_price?: number;

  notes?: string;
  created_at: string;

  // Relations
  asset?: Asset;
}

// Warehouse Stats Types
export interface WarehouseStats {
  total_assets: number;
  available_assets: number;
  in_use_assets: number;
  maintenance_assets: number;
  total_value: number;
  total_locations: number;
  occupancy_rate: number;
}

// Helper types for external references
interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
}

interface Project {
  id: string;
  name: string;
  code?: string;
  status?: string;
}

interface Company {
  id: string;
  name: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Filter Types
export interface AssetFilters {
  search?: string;
  warehouse_id?: string;
  category_id?: string;
  status?: AssetStatus;
  type?: AssetType;
  is_consumable?: boolean;
  assigned_to_user_id?: string;
  assigned_to_project_id?: string;
  requires_maintenance?: boolean;
  low_stock?: boolean;
}

export interface TransferFilters {
  status?: TransferStatus;
  transfer_type?: TransferType;
  warehouse_id?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  maintenance_type?: MaintenanceType;
  asset_id?: string;
  from_date?: string;
  to_date?: string;
  upcoming_days?: number;
}
