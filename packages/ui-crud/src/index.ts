// ============ UI CRUD PACKAGE ============
// Auto-generated CRUD components for EOS2 resources

// Components
export { ResourceTable, type ResourceTableProps } from './components/ResourceTable'
export { ResourceForm, type ResourceFormProps } from './components/ResourceForm'
export { ResourceShow, RelationShow, type ResourceShowProps, type RelationShowProps } from './components/ResourceShow'

// Formatters
export {
  // Date formatters
  formatDate,
  formatDateTime,
  formatRelativeTime,
  // Number formatters
  formatNumber,
  formatCurrency,
  // Components
  StatusBadge,
  BooleanDisplay,
  EmailDisplay,
  PhoneDisplay,
  LinkDisplay,
  ImageDisplay,
  ProgressDisplay,
  TagsDisplay,
  // Utilities
  formatValue,
  getNestedValue,
  getCellAlignment,
} from './formatters'

// Page generators
export {
  ResourceListPage,
  ResourceShowPage,
  ResourceEditPage,
  ResourceCreatePage,
  type ResourceListPageProps,
  type ResourceShowPageProps,
  type ResourceEditPageProps,
  type TabDefinition,
} from './pages'

// Layout components
export {
  ResourceNavigation,
  ResourceLayout,
  ResourceHeader,
  ResourceBreadcrumbs,
  PageContainer,
  Card,
  type ResourceNavigationProps,
  type NavigationItem,
  type ResourceLayoutProps,
  type ResourceHeaderProps,
  type ResourceBreadcrumbsProps,
  type BreadcrumbItem,
  type PageContainerProps,
  type CardProps,
} from './layout'
