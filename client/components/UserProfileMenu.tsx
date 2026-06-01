import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { User, Settings, LogOut, MoreVertical, Wallet, Package, MessageSquare, Shield } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  username: string
  role: string
  publicId?: string
}

interface UserProfileMenuProps {
  variant?: 'profile' | 'dots' // 'profile' shows avatar, 'dots' shows three dots
}

export default function UserProfileMenu({ variant = 'profile' }: UserProfileMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setUser(response.data?.user ?? response.data)
      } catch (error) {
        // User not authenticated or token invalid
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
    setIsOpen(false)
  }

  // Don't show menu if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
        >
          Register
        </Link>
      </div>
    )
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="relative" ref={menuRef}>
      {variant === 'profile' ? (
        /* Profile Button - Avatar */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
            {getInitials()}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {user.username || user.email}
          </span>
        </button>
      ) : (
        /* Three Dots Menu Button - Alternative when profile is hidden */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Account menu"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-panel absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[100]">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-lg font-semibold">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {user.publicId && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">ID: {user.publicId}</p>
                )}
                {user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/settings?tab=account')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              <User className="w-5 h-5" />
              <span>My Account</span>
            </button>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              <Package className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/wallet"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              <Wallet className="w-5 h-5" />
              <span>Wallet</span>
            </Link>

            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </Link>

            {(user.role === 'ADMIN' || user.role === 'FULL_ADMIN' || user.role === 'LIMITED_ADMIN') && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                <Shield className="w-5 h-5" />
                <span>Admin Panel</span>
              </Link>
            )}

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>

            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

