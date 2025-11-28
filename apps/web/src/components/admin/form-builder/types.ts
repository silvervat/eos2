// Form Builder Types - from RIVEST-COMPLETE-GUIDE.md Chapter 34

export type FieldType =
  // Text inputs
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'textarea'
  // Choices
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multi_select'
  // Date & Time
  | 'date'
  | 'time'
  | 'datetime'
  // File
  | 'file_upload'
  // Advanced
  | 'signature'
  | 'rating'
  | 'slider'
  // Display
  | 'heading'
  | 'paragraph'
  | 'divider'

export interface FieldOption {
  label: string
  value: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom'
  value?: string | number
  message?: string
}

export interface ConditionalRule {
  field: string
  operator: '==' | '!=' | '>' | '<' | 'contains' | 'empty' | 'not_empty'
  value: string
  action: 'show' | 'hide' | 'require' | 'enable' | 'disable'
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  description?: string
  required: boolean
  validation?: ValidationRule[]
  options?: FieldOption[]
  conditionalLogic?: ConditionalRule[]
  width?: 'full' | 'half' | 'third'
  className?: string
  settings?: Record<string, unknown>
}

export interface FormTemplate {
  id: string
  tenantId: string
  name: string
  description?: string
  category: string
  fields: FormField[]
  settings: FormSettings
  theme: FormTheme
  createdAt: Date
  updatedAt: Date
}

export interface FormSettings {
  submitButtonText: string
  submitRedirectUrl?: string
  showProgressBar: boolean
  savePartialData: boolean
  allowMultipleSubmissions: boolean
  requireAuth: boolean
  captcha: boolean
  emailNotifications: boolean
  autoSave: boolean
  language: string
}

export interface FormTheme {
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  fontSize: number
  borderRadius: number
  fieldSpacing: number
  labelPosition: 'top' | 'left' | 'placeholder'
  customCSS?: string
}

// Field category for palette
export interface FieldCategory {
  name: string
  label: string
  fields: {
    type: FieldType
    label: string
    icon: string
  }[]
}

export const FIELD_CATEGORIES: FieldCategory[] = [
  {
    name: 'text',
    label: 'Tekst',
    fields: [
      { type: 'text', label: 'Tekst', icon: 'Type' },
      { type: 'email', label: 'E-post', icon: 'Mail' },
      { type: 'phone', label: 'Telefon', icon: 'Phone' },
      { type: 'number', label: 'Number', icon: 'Hash' },
      { type: 'url', label: 'URL', icon: 'Link' },
      { type: 'textarea', label: 'Tekstiala', icon: 'AlignLeft' },
    ],
  },
  {
    name: 'choice',
    label: 'Valikud',
    fields: [
      { type: 'select', label: 'Rippmenüü', icon: 'ChevronDown' },
      { type: 'radio', label: 'Raadionupud', icon: 'Circle' },
      { type: 'checkbox', label: 'Märkeruut', icon: 'CheckSquare' },
      { type: 'multi_select', label: 'Mitu valikut', icon: 'List' },
    ],
  },
  {
    name: 'datetime',
    label: 'Kuupäev ja aeg',
    fields: [
      { type: 'date', label: 'Kuupäev', icon: 'Calendar' },
      { type: 'time', label: 'Kellaaeg', icon: 'Clock' },
      { type: 'datetime', label: 'Kuupäev ja aeg', icon: 'CalendarClock' },
    ],
  },
  {
    name: 'advanced',
    label: 'Täpsem',
    fields: [
      { type: 'file_upload', label: 'Fail', icon: 'Upload' },
      { type: 'signature', label: 'Allkiri', icon: 'PenTool' },
      { type: 'rating', label: 'Hinnang', icon: 'Star' },
      { type: 'slider', label: 'Liugur', icon: 'Sliders' },
    ],
  },
  {
    name: 'display',
    label: 'Kuvamine',
    fields: [
      { type: 'heading', label: 'Pealkiri', icon: 'Heading' },
      { type: 'paragraph', label: 'Tekst', icon: 'Text' },
      { type: 'divider', label: 'Eraldaja', icon: 'Minus' },
    ],
  },
]

export function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Tekstiväli',
    email: 'E-posti aadress',
    phone: 'Telefoninumber',
    number: 'Number',
    url: 'Veebiaadress',
    textarea: 'Tekstiala',
    select: 'Vali...',
    radio: 'Vali üks',
    checkbox: 'Märkeruut',
    multi_select: 'Vali mitu',
    date: 'Kuupäev',
    time: 'Kellaaeg',
    datetime: 'Kuupäev ja kellaaeg',
    file_upload: 'Lae fail üles',
    signature: 'Allkiri',
    rating: 'Hinnang',
    slider: 'Liugur',
    heading: 'Pealkiri',
    paragraph: 'Lõik teksti',
    divider: '',
  }
  return labels[type] || type
}

export function getDefaultSettings(type: FieldType): Record<string, unknown> {
  switch (type) {
    case 'number':
      return { min: undefined, max: undefined, step: 1 }
    case 'textarea':
      return { rows: 4 }
    case 'select':
    case 'radio':
    case 'checkbox':
    case 'multi_select':
      return {
        options: [
          { label: 'Valik 1', value: 'option_1' },
          { label: 'Valik 2', value: 'option_2' },
          { label: 'Valik 3', value: 'option_3' },
        ],
      }
    case 'rating':
      return { maxRating: 5 }
    case 'slider':
      return { min: 0, max: 100, step: 1 }
    case 'heading':
      return { level: 2 }
    default:
      return {}
  }
}

export function generateId(): string {
  return `field_${Math.random().toString(36).substring(2, 9)}`
}
