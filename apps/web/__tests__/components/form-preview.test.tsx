import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormPreview } from '@/components/admin/form-builder/form-preview'
import { FormField, FormSettings, FormTheme } from '@/components/admin/form-builder/types'

const defaultSettings: FormSettings = {
  submitButtonText: 'Saada',
  showProgressBar: false,
  savePartialData: false,
  allowMultipleSubmissions: true,
  requireAuth: false,
  captcha: false,
  emailNotifications: true,
  autoSave: true,
  language: 'et',
}

const defaultTheme: FormTheme = {
  primaryColor: '#279989',
  backgroundColor: '#ffffff',
  fontFamily: 'system-ui',
  fontSize: 14,
  borderRadius: 8,
  fieldSpacing: 16,
  labelPosition: 'top',
}

describe('FormPreview', () => {
  describe('Rendering', () => {
    it('renders text input field correctly', () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          placeholder: 'Sisesta nimi',
          required: true,
          width: 'full',
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByLabelText(/nimi/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Sisesta nimi')).toBeInTheDocument()
    })

    it('renders email input with validation', () => {
      const fields: FormField[] = [
        {
          id: 'email',
          type: 'email',
          label: 'E-post',
          required: true,
          width: 'full',
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByLabelText(/e-post/i)).toBeInTheDocument()
    })

    it('renders select field with options', () => {
      const fields: FormField[] = [
        {
          id: 'country',
          type: 'select',
          label: 'Riik',
          required: false,
          width: 'full',
          settings: {
            options: [
              { label: 'Eesti', value: 'ee' },
              { label: 'Soome', value: 'fi' },
            ],
          },
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByLabelText(/riik/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders radio buttons correctly', () => {
      const fields: FormField[] = [
        {
          id: 'gender',
          type: 'radio',
          label: 'Sugu',
          required: false,
          width: 'full',
          settings: {
            options: [
              { label: 'Mees', value: 'male' },
              { label: 'Naine', value: 'female' },
            ],
          },
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByText('Mees')).toBeInTheDocument()
      expect(screen.getByText('Naine')).toBeInTheDocument()
      expect(screen.getAllByRole('radio')).toHaveLength(2)
    })

    it('renders checkbox fields correctly', () => {
      const fields: FormField[] = [
        {
          id: 'interests',
          type: 'checkbox',
          label: 'Huvid',
          required: false,
          width: 'full',
          settings: {
            options: [
              { label: 'Sport', value: 'sport' },
              { label: 'Muusika', value: 'music' },
            ],
          },
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByText('Sport')).toBeInTheDocument()
      expect(screen.getByText('Muusika')).toBeInTheDocument()
    })

    it('renders rating field correctly', () => {
      const fields: FormField[] = [
        {
          id: 'rating',
          type: 'rating',
          label: 'Hinnang',
          required: false,
          width: 'full',
          settings: { maxRating: 5 },
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByText('Hinnang')).toBeInTheDocument()
      // 5 star buttons
      expect(screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'))).toHaveLength(5)
    })

    it('renders heading element correctly', () => {
      const fields: FormField[] = [
        {
          id: 'heading',
          type: 'heading',
          label: 'Pealkiri',
          required: false,
          settings: { level: 2 },
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pealkiri')
    })

    it('renders paragraph correctly', () => {
      const fields: FormField[] = [
        {
          id: 'para',
          type: 'paragraph',
          label: 'See on tekst',
          required: false,
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByText('See on tekst')).toBeInTheDocument()
    })

    it('renders divider correctly', () => {
      const fields: FormField[] = [
        {
          id: 'divider',
          type: 'divider',
          label: '',
          required: false,
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      expect(document.querySelector('hr')).toBeInTheDocument()
    })

    it('renders submit button with custom text', () => {
      const customSettings = { ...defaultSettings, submitButtonText: 'Saada vastused' }

      render(
        <FormPreview
          fields={[]}
          settings={customSettings}
          theme={defaultTheme}
        />
      )

      expect(screen.getByRole('button', { name: 'Saada vastused' })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows error for required empty field on submit', async () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          required: true,
          width: 'full',
        },
      ]

      const onSubmit = jest.fn()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
          onSubmit={onSubmit}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      await waitFor(() => {
        expect(screen.getByText(/kohustuslik/i)).toBeInTheDocument()
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error for invalid email', async () => {
      const fields: FormField[] = [
        {
          id: 'email',
          type: 'email',
          label: 'E-post',
          required: true,
          width: 'full',
        },
      ]

      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      await user.type(screen.getByLabelText(/e-post/i), 'invalid-email')
      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      await waitFor(() => {
        expect(screen.getByText(/kehtiv e-posti/i)).toBeInTheDocument()
      })
    })

    it('validates phone number format', async () => {
      const fields: FormField[] = [
        {
          id: 'phone',
          type: 'phone',
          label: 'Telefon',
          required: true,
          width: 'full',
        },
      ]

      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      await user.type(screen.getByLabelText(/telefon/i), 'abc')
      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      await waitFor(() => {
        expect(screen.getByText(/kehtiv telefoninumber/i)).toBeInTheDocument()
      })
    })
  })

  describe('Interaction', () => {
    it('handles text input change', async () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          required: false,
          width: 'full',
        },
      ]

      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      const input = screen.getByLabelText(/nimi/i)
      await user.type(input, 'Test Nimi')

      expect(input).toHaveValue('Test Nimi')
    })

    it('handles select change', async () => {
      const fields: FormField[] = [
        {
          id: 'country',
          type: 'select',
          label: 'Riik',
          required: false,
          width: 'full',
          settings: {
            options: [
              { label: 'Eesti', value: 'ee' },
              { label: 'Soome', value: 'fi' },
            ],
          },
        },
      ]

      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'ee')

      expect(select).toHaveValue('ee')
    })

    it('handles rating selection', async () => {
      const fields: FormField[] = [
        {
          id: 'rating',
          type: 'rating',
          label: 'Hinnang',
          required: false,
          width: 'full',
          settings: { maxRating: 5 },
        },
      ]

      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
        />
      )

      const stars = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'))
      await user.click(stars[2]) // Click 3rd star

      // The 3rd star should be filled (rating = 3)
      expect(stars[2].querySelector('svg')).toHaveAttribute('fill', '#279989')
    })

    it('calls onSubmit with form data', async () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          required: true,
          width: 'full',
        },
      ]

      const onSubmit = jest.fn()
      const user = userEvent.setup()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
          onSubmit={onSubmit}
        />
      )

      await user.type(screen.getByLabelText(/nimi/i), 'Test')
      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Test' })
      })
    })

    it('shows success message after submission', async () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          required: false,
          width: 'full',
        },
      ]

      const onSubmit = jest.fn()

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
          onSubmit={onSubmit}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      await waitFor(() => {
        expect(screen.getByText(/täname/i)).toBeInTheDocument()
      })
    })
  })

  describe('Preview Mode', () => {
    it('shows alert in preview mode on submit', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Nimi',
          required: false,
          width: 'full',
        },
      ]

      render(
        <FormPreview
          fields={fields}
          settings={defaultSettings}
          theme={defaultTheme}
          isPreview={true}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /saada/i }))

      expect(alertMock).toHaveBeenCalledWith('Eelvaate režiimis vormi ei saa esitada')
      alertMock.mockRestore()
    })
  })
})
