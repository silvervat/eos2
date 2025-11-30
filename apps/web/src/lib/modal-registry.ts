'use client'

/**
 * Modal Registry System
 *
 * Automaatne modalide tuvastus- ja registreerimissusteem.
 * Kogub koik rakenduse modalid uhte kohta, et neid saaks CMS-is hallata.
 */

import type { ModalTemplate, ModalType, IconType, ButtonVariant } from '@/components/admin/modal-designer/types'

// Registry entry for a modal component
export interface ModalRegistryEntry {
  key: string
  name: string
  description?: string
  type: ModalType
  category: string
  componentPath: string // Path to the component file
  icon: IconType
  iconColor: string
  iconBgColor: string
  title: string
  message?: string
  buttons: {
    label: string
    variant: ButtonVariant
    action: 'confirm' | 'cancel' | 'custom'
  }[]
  hasInputs: boolean
  isForm: boolean
  features: string[] // Features like 'typed-confirmation', 'loading-state', etc.
}

// Global modal registry
const modalRegistry = new Map<string, ModalRegistryEntry>()

// Registry change listeners
type RegistryListener = (entries: ModalRegistryEntry[]) => void
const listeners = new Set<RegistryListener>()

/**
 * Register a modal component
 */
export function registerModal(entry: ModalRegistryEntry): void {
  modalRegistry.set(entry.key, entry)
  notifyListeners()
}

/**
 * Unregister a modal
 */
export function unregisterModal(key: string): void {
  modalRegistry.delete(key)
  notifyListeners()
}

/**
 * Get all registered modals
 */
export function getRegisteredModals(): ModalRegistryEntry[] {
  return Array.from(modalRegistry.values())
}

/**
 * Get a specific modal by key
 */
export function getModalByKey(key: string): ModalRegistryEntry | undefined {
  return modalRegistry.get(key)
}

/**
 * Subscribe to registry changes
 */
export function subscribeToRegistry(listener: RegistryListener): () => void {
  listeners.add(listener)
  // Call immediately with current state
  listener(getRegisteredModals())
  // Return unsubscribe function
  return () => listeners.delete(listener)
}

function notifyListeners(): void {
  const entries = getRegisteredModals()
  listeners.forEach(listener => listener(entries))
}

/**
 * Convert registry entry to ModalTemplate for CMS
 */
export function registryEntryToTemplate(entry: ModalRegistryEntry): Partial<ModalTemplate> {
  return {
    key: entry.key,
    name: entry.name,
    description: entry.description,
    type: entry.type,
    category: entry.category,
    icon: {
      type: entry.icon,
      color: entry.iconColor,
      backgroundColor: entry.iconBgColor,
      size: 'md',
      animation: 'none',
    },
    content: {
      title: entry.title,
      titleSize: 'lg',
      titleAlign: 'center',
      titleColor: '#1e293b',
      message: entry.message || '',
      messageSize: 'md',
      messageAlign: 'center',
      messageColor: '#64748b',
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
    },
    buttons: entry.buttons.map((btn, i) => ({
      id: `btn-${i}`,
      label: btn.label,
      variant: btn.variant,
      action: btn.action,
      order: i,
    })),
    isSystem: false,
    isActive: true,
    tags: entry.features,
  }
}

// ============================================================================
// Pre-registered Modals (auto-detected from codebase)
// ============================================================================

// ConfirmationDialog variants
registerModal({
  key: 'confirmation-dialog-danger',
  name: 'Kustutamise dialoog',
  description: 'Punane kustutamise kinnitusdialoog koos typing-confirmation voimalusega',
  type: 'confirmation',
  category: 'system',
  componentPath: 'src/components/ui/confirmation-dialog.tsx',
  icon: 'trash',
  iconColor: '#ef4444',
  iconBgColor: '#fee2e2',
  title: 'Kustuta element',
  message: 'Kas olete kindel, et soovite selle elemendi kustutada? See toiming on poordumatu.',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Kustuta', variant: 'destructive', action: 'confirm' },
  ],
  hasInputs: true, // typed confirmation
  isForm: false,
  features: ['typed-confirmation', 'loading-state', 'context-provider'],
})

registerModal({
  key: 'confirmation-dialog-warning',
  name: 'Hoiatuse dialoog',
  description: 'Kollane hoiatusdialoog',
  type: 'warning',
  category: 'system',
  componentPath: 'src/components/ui/confirmation-dialog.tsx',
  icon: 'warning',
  iconColor: '#f59e0b',
  iconBgColor: '#fef3c7',
  title: 'Tahelepanu',
  message: 'See toiming vajab kinnitust.',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Kinnita', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: false,
  isForm: false,
  features: ['loading-state', 'context-provider'],
})

registerModal({
  key: 'confirmation-dialog-info',
  name: 'Info dialoog',
  description: 'Sinine info dialoog',
  type: 'info',
  category: 'system',
  componentPath: 'src/components/ui/confirmation-dialog.tsx',
  icon: 'info',
  iconColor: '#3b82f6',
  iconBgColor: '#dbeafe',
  title: 'Teadmiseks',
  message: 'Oluline info kasutajale.',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Selge', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: false,
  isForm: false,
  features: ['loading-state', 'context-provider'],
})

registerModal({
  key: 'confirmation-dialog-success',
  name: 'Eduteate dialoog',
  description: 'Roheline eduka toimingu dialoog',
  type: 'success',
  category: 'system',
  componentPath: 'src/components/ui/confirmation-dialog.tsx',
  icon: 'success',
  iconColor: '#22c55e',
  iconBgColor: '#dcfce7',
  title: 'Toiming onnestus!',
  message: 'Teie toiming on edukalt teostatud.',
  buttons: [
    { label: 'Selge', variant: 'success', action: 'confirm' },
  ],
  hasInputs: false,
  isForm: false,
  features: ['loading-state', 'context-provider'],
})

// AddProjectModal
registerModal({
  key: 'add-project-modal',
  name: 'Lisa projekt',
  description: 'Uue projekti lisamise vorm koos koigi vajalike valjadega',
  type: 'form',
  category: 'crud',
  componentPath: 'src/components/projects/add-project-modal.tsx',
  icon: 'plus',
  iconColor: '#279989',
  iconBgColor: '#27998920',
  title: 'Lisa uus projekt',
  message: 'Loo uus ehitusprojekt',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Lisa projekt', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: true,
  isForm: true,
  features: ['form-validation', 'loading-state', 'tanstack-query'],
})

// ExportDialog
registerModal({
  key: 'export-dialog',
  name: 'Ekspordi dialoog',
  description: 'Andmete eksportimise dialoog XLSX/CSV formaadis',
  type: 'form',
  category: 'forms',
  componentPath: 'src/components/import-export/export-dialog.tsx',
  icon: 'save',
  iconColor: '#279989',
  iconBgColor: '#27998920',
  title: 'Ekspordi andmed',
  message: 'Valige formaat ja veerud eksportimiseks',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Ekspordi', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: true,
  isForm: true,
  features: ['format-selection', 'column-selection', 'xlsx-export', 'csv-export'],
})

// DynamicFieldDialog
registerModal({
  key: 'dynamic-field-dialog',
  name: 'Dunaamse valja dialoog',
  description: 'CMS dunaamiliste valjade lisamise ja muutmise dialoog',
  type: 'form',
  category: 'forms',
  componentPath: 'src/components/admin/cms/dynamic-field-dialog.tsx',
  icon: 'edit',
  iconColor: '#279989',
  iconBgColor: '#27998920',
  title: 'Lisa uus vali',
  message: 'Loo uus dunaamiline vali',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Lisa vali', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: true,
  isForm: true,
  features: ['field-types', 'options-editor', 'permissions', 'validation'],
})

// PreviewDialog - UltraTable Dialog Designer
registerModal({
  key: 'preview-dialog',
  name: 'Vormi eelvaate dialoog',
  description: 'UltraTable dialoogi kujundaja eelvaate modal',
  type: 'form',
  category: 'forms',
  componentPath: 'src/components/admin/ultra-table/dialog-designer/PreviewDialog.tsx',
  icon: 'info',
  iconColor: '#279989',
  iconBgColor: '#27998920',
  title: 'Vormi eelvaade',
  message: 'Vaata vormi valimust enne salvestamist',
  buttons: [
    { label: 'Sulge', variant: 'outline', action: 'cancel' },
    { label: 'Salvesta', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: true,
  isForm: true,
  features: ['preview-mode', 'dynamic-fields', 'section-layout', 'validation'],
})

// ImportPreview - Import Dialog
registerModal({
  key: 'import-preview-dialog',
  name: 'Impordi dialoog',
  description: 'Andmete importimise dialoog XLSX/CSV failidest koos eelvaatega',
  type: 'form',
  category: 'forms',
  componentPath: 'src/components/import-export/import-preview.tsx',
  icon: 'plus',
  iconColor: '#279989',
  iconBgColor: '#27998920',
  title: 'Impordi andmed',
  message: 'Laadi ules XLSX voi CSV fail andmete importimiseks',
  buttons: [
    { label: 'Tuhista', variant: 'outline', action: 'cancel' },
    { label: 'Impordi', variant: 'primary', action: 'confirm' },
  ],
  hasInputs: true,
  isForm: true,
  features: ['drag-drop', 'file-upload', 'xlsx-import', 'csv-import', 'validation', 'preview-table', 'pagination'],
})
