import {
  getDefaultLabel,
  getDefaultSettings,
  generateId,
  FIELD_CATEGORIES,
  FieldType,
} from '@/components/admin/form-builder/types'

describe('Form Types Utilities', () => {
  describe('getDefaultLabel', () => {
    it('returns correct label for text field', () => {
      expect(getDefaultLabel('text')).toBe('Tekstiväli')
    })

    it('returns correct label for email field', () => {
      expect(getDefaultLabel('email')).toBe('E-posti aadress')
    })

    it('returns correct label for phone field', () => {
      expect(getDefaultLabel('phone')).toBe('Telefoninumber')
    })

    it('returns correct label for select field', () => {
      expect(getDefaultLabel('select')).toBe('Vali...')
    })

    it('returns correct label for date field', () => {
      expect(getDefaultLabel('date')).toBe('Kuupäev')
    })

    it('returns correct label for rating field', () => {
      expect(getDefaultLabel('rating')).toBe('Hinnang')
    })

    it('returns correct label for heading field', () => {
      expect(getDefaultLabel('heading')).toBe('Pealkiri')
    })

    it('returns correct label for divider (empty)', () => {
      expect(getDefaultLabel('divider')).toBe('')
    })

    it('returns field type as fallback for unknown types', () => {
      // @ts-expect-error - testing unknown type
      expect(getDefaultLabel('unknown')).toBe('unknown')
    })
  })

  describe('getDefaultSettings', () => {
    it('returns number settings with step', () => {
      const settings = getDefaultSettings('number')
      expect(settings).toEqual({ min: undefined, max: undefined, step: 1 })
    })

    it('returns textarea settings with rows', () => {
      const settings = getDefaultSettings('textarea')
      expect(settings).toEqual({ rows: 4 })
    })

    it('returns select settings with default options', () => {
      const settings = getDefaultSettings('select')
      expect(settings.options).toBeDefined()
      expect(settings.options).toHaveLength(3)
      expect(settings.options[0]).toEqual({ label: 'Valik 1', value: 'option_1' })
    })

    it('returns radio settings with default options', () => {
      const settings = getDefaultSettings('radio')
      expect(settings.options).toBeDefined()
      expect(settings.options).toHaveLength(3)
    })

    it('returns checkbox settings with default options', () => {
      const settings = getDefaultSettings('checkbox')
      expect(settings.options).toBeDefined()
      expect(settings.options).toHaveLength(3)
    })

    it('returns multi_select settings with default options', () => {
      const settings = getDefaultSettings('multi_select')
      expect(settings.options).toBeDefined()
    })

    it('returns rating settings with maxRating', () => {
      const settings = getDefaultSettings('rating')
      expect(settings).toEqual({ maxRating: 5 })
    })

    it('returns slider settings with min, max, step', () => {
      const settings = getDefaultSettings('slider')
      expect(settings).toEqual({ min: 0, max: 100, step: 1 })
    })

    it('returns heading settings with level', () => {
      const settings = getDefaultSettings('heading')
      expect(settings).toEqual({ level: 2 })
    })

    it('returns empty object for text fields', () => {
      const settings = getDefaultSettings('text')
      expect(settings).toEqual({})
    })

    it('returns empty object for email fields', () => {
      const settings = getDefaultSettings('email')
      expect(settings).toEqual({})
    })

    it('returns empty object for date fields', () => {
      const settings = getDefaultSettings('date')
      expect(settings).toEqual({})
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      const id3 = generateId()

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('generates IDs with correct prefix', () => {
      const id = generateId()
      expect(id).toMatch(/^field_[a-z0-9]+$/)
    })

    it('generates IDs with expected length', () => {
      const id = generateId()
      // field_ (6 chars) + 7 random chars = 13 chars
      expect(id.length).toBe(13)
    })
  })

  describe('FIELD_CATEGORIES', () => {
    it('has all expected categories', () => {
      const categoryNames = FIELD_CATEGORIES.map((c) => c.name)
      expect(categoryNames).toContain('text')
      expect(categoryNames).toContain('choice')
      expect(categoryNames).toContain('datetime')
      expect(categoryNames).toContain('advanced')
      expect(categoryNames).toContain('display')
    })

    it('has Estonian labels for categories', () => {
      const textCategory = FIELD_CATEGORIES.find((c) => c.name === 'text')
      expect(textCategory?.label).toBe('Tekst')

      const choiceCategory = FIELD_CATEGORIES.find((c) => c.name === 'choice')
      expect(choiceCategory?.label).toBe('Valikud')

      const displayCategory = FIELD_CATEGORIES.find((c) => c.name === 'display')
      expect(displayCategory?.label).toBe('Kuvamine')
    })

    it('text category contains expected field types', () => {
      const textCategory = FIELD_CATEGORIES.find((c) => c.name === 'text')
      const fieldTypes = textCategory?.fields.map((f) => f.type) || []

      expect(fieldTypes).toContain('text')
      expect(fieldTypes).toContain('email')
      expect(fieldTypes).toContain('phone')
      expect(fieldTypes).toContain('number')
      expect(fieldTypes).toContain('url')
      expect(fieldTypes).toContain('textarea')
    })

    it('choice category contains expected field types', () => {
      const choiceCategory = FIELD_CATEGORIES.find((c) => c.name === 'choice')
      const fieldTypes = choiceCategory?.fields.map((f) => f.type) || []

      expect(fieldTypes).toContain('select')
      expect(fieldTypes).toContain('radio')
      expect(fieldTypes).toContain('checkbox')
      expect(fieldTypes).toContain('multi_select')
    })

    it('datetime category contains expected field types', () => {
      const datetimeCategory = FIELD_CATEGORIES.find((c) => c.name === 'datetime')
      const fieldTypes = datetimeCategory?.fields.map((f) => f.type) || []

      expect(fieldTypes).toContain('date')
      expect(fieldTypes).toContain('time')
      expect(fieldTypes).toContain('datetime')
    })

    it('advanced category contains expected field types', () => {
      const advancedCategory = FIELD_CATEGORIES.find((c) => c.name === 'advanced')
      const fieldTypes = advancedCategory?.fields.map((f) => f.type) || []

      expect(fieldTypes).toContain('file_upload')
      expect(fieldTypes).toContain('signature')
      expect(fieldTypes).toContain('rating')
      expect(fieldTypes).toContain('slider')
    })

    it('display category contains expected field types', () => {
      const displayCategory = FIELD_CATEGORIES.find((c) => c.name === 'display')
      const fieldTypes = displayCategory?.fields.map((f) => f.type) || []

      expect(fieldTypes).toContain('heading')
      expect(fieldTypes).toContain('paragraph')
      expect(fieldTypes).toContain('divider')
    })

    it('all fields have icon property', () => {
      FIELD_CATEGORIES.forEach((category) => {
        category.fields.forEach((field) => {
          expect(field.icon).toBeDefined()
          expect(typeof field.icon).toBe('string')
        })
      })
    })

    it('all fields have label property', () => {
      FIELD_CATEGORIES.forEach((category) => {
        category.fields.forEach((field) => {
          expect(field.label).toBeDefined()
          expect(typeof field.label).toBe('string')
        })
      })
    })
  })
})
