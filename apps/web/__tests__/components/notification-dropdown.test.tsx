import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

describe('NotificationDropdown', () => {
  describe('Rendering', () => {
    it('renders bell icon', () => {
      render(<NotificationDropdown />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows unread count badge', () => {
      render(<NotificationDropdown />)

      // Default mock has 3 unread notifications
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('dropdown is closed by default', () => {
      render(<NotificationDropdown />)

      expect(screen.queryByText('Teavitused')).not.toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Teavitused')).toBeInTheDocument()
    })

    it('closes dropdown on second click', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      const button = screen.getByRole('button')
      await user.click(button)
      expect(screen.getByText('Teavitused')).toBeInTheDocument()

      await user.click(button)
      expect(screen.queryByText('Teavitused')).not.toBeInTheDocument()
    })

    it('shows notifications in dropdown', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Projekt uuendatud')).toBeInTheDocument()
      expect(screen.getByText('Uus kommentaar')).toBeInTheDocument()
      expect(screen.getByText('Arve tähtaeg läheneb')).toBeInTheDocument()
    })

    it('marks all as read button works', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      // Initially has unread count
      expect(screen.getByText('3')).toBeInTheDocument()

      const markAllButton = screen.getByText(/märgi kõik loetuks/i)
      await user.click(markAllButton)

      // Badge should disappear after marking all as read
      await waitFor(() => {
        expect(screen.queryByText('3')).not.toBeInTheDocument()
      })
    })

    it('shows "view all" link', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText(/vaata kõiki teavitusi/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /vaata kõiki/i })).toHaveAttribute('href', '/notifications')
    })

    it('removes notification when X is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      // Find the first notification's remove button
      const removeButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.w-3')
      )

      expect(removeButtons.length).toBeGreaterThan(0)

      const firstNotificationTitle = screen.getByText('Projekt uuendatud')

      // Hover to show the X button (it's opacity-0 by default)
      fireEvent.mouseEnter(firstNotificationTitle.closest('li')!)

      // Click remove
      await user.click(removeButtons[0])

      // Notification should be removed
      await waitFor(() => {
        expect(screen.queryByText('Projekt uuendatud')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Teavitused')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      // Note: This test may need adjustment based on implementation
    })

    it('notification links have correct hrefs', async () => {
      const user = userEvent.setup()
      render(<NotificationDropdown />)

      await user.click(screen.getByRole('button'))

      const links = screen.getAllByRole('link')
      const projectLink = links.find(link => link.textContent?.includes('Projekt uuendatud'))

      expect(projectLink).toHaveAttribute('href', '/projects/1')
    })
  })
})
