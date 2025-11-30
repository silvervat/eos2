export { ModalDesigner } from './modal-designer'
export { ModalList } from './modal-list'
export * from './types'

// Re-export modal registry utilities
export {
  registerModal,
  unregisterModal,
  getRegisteredModals,
  getModalByKey,
  subscribeToRegistry,
  registryEntryToTemplate,
  type ModalRegistryEntry,
} from '@/lib/modal-registry'

export { useModalRegistry, useModalsByCategory, useModalByKey } from '@/hooks/use-modal-registry'
