import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { 
  User, Mail, Phone, Calendar, Shield, Edit2, Save, X, 
  Wallet, Package, MessageSquare, Settings, ArrowLeft,
  Lock, Bell, Eye, EyeOff, Key, AlertTriangle, Trash2, Download,
  Globe, Smartphone, CreditCard, Activity
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  username: string
  phone?: string
  role: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
}

interface WalletData {
  balance: string
  currency: string
}

interface AccountSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  promotionalEmails: boolean
  profileVisibility: 'public' | 'private' | 'friends'
  twoFactorEnabled: boolean
  showOnlineStatus: boolean
  allowDirectMessages: boolean
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('profile')

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<UserData>()

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>()

  const [settings, setSettings] = useState<AccountSettings>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    orderUpdates: true,
    securityAlerts: true,
    promotionalEmails: false,
    profileVisibility: 'public',
    twoFactorEnabled: false,
    showOnlineStatus: true,
    allowDirectMessages: true
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchUserData(token)
    fetchWalletData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
      resetProfile(response.data.user)
      setIsLoading(false)
      setError(null)
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
      } else {
        setError('Failed to load user data. Please try refreshing the page.')
        toast.error('Failed to load user data')
        setIsLoading(false)
      }
    }
  }

  const fetchWalletData = async (token: string) => {
    try {
      const response = await axios.get('/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setWallet(response.data)
    } catch (error) {
      console.error('Failed to load wallet:', error)
    }
  }

  const onProfileSubmit = async (data: Partial<UserData>) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await axios.put('/api/auth/profile', {
        username: data.username,
        phone: data.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      toast.success('Profile updated successfully!')
      setIsEditingProfile(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const onPasswordSubmit = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.put('/api/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Password changed successfully!')
      setIsChangingPassword(false)
      resetPassword()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  const onSettingsSubmit = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.put('/api/user/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Settings updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update settings')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.delete('/api/auth/account', {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error: any) {
      toast.error('Failed to delete account')
    }
  }

  const handleExportData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await axios.get('/api/user/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'my-data.json')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Data exported successfully')
    } catch (error: any) {
      toast.error('Failed to export data')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Unable to load account information.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>My Account - The Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                The Bridge
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Page Header */}
            <div className="mb-8">
              <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition">
                  Dashboard
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-700 dark:text-gray-300">My Account</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your profile, security, and preferences
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <ul className="space-y-2">
                    {[
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'security', label: 'Security', icon: Shield },
                      { id: 'notifications', label: 'Notifications', icon: Bell },
                      { id: 'privacy', label: 'Privacy', icon: Eye },
                      { id: 'wallet', label: 'Wallet', icon: Wallet },
                      { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
                    ].map(({ id, label, icon: Icon }) => (
                      <li key={id}>
                        <button
                          onClick={() => setActiveSection(id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                            activeSection === id
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Profile Section */}
                {activeSection === 'profile' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                      </h2>
                      {!isEditingProfile ? (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingProfile(false)
                              resetProfile(user)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={handleProfileSubmit(onProfileSubmit)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username
                          </label>
                          {isEditingProfile ? (
                            <input
                              {...registerProfile('username', {
                                required: 'Username is required',
                                minLength: { value: 3, message: 'Username must be at least 3 characters' }
                              })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          ) : (
                            <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                              {user.username}
                            </p>
                          )}
                          {profileErrors.username && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {profileErrors.username.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {user.email}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Email cannot be changed
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                          </label>
                          {isEditingProfile ? (
                            <input
                              {...registerProfile('phone')}
                              type="tel"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter phone number"
                            />
                          ) : (
                            <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                              {user.phone || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Account Status
                          </label>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.isVerified ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {user.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Member Since
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Section */}
                {activeSection === 'security' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </h2>

                    <div className="space-y-6">
                      {/* Password Change */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                        {!isChangingPassword ? (
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                          >
                            <Lock className="w-4 h-4" />
                            Change Password
                          </button>
                        ) : (
                          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                                  type={showPassword ? 'text' : 'password'}
                                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                              {passwordErrors.currentPassword && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                  {passwordErrors.currentPassword.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  {...registerPassword('newPassword', {
                                    required: 'New password is required',
                                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                  })}
                                  type={showNewPassword ? 'text' : 'password'}
                                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                              {passwordErrors.newPassword && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                  {passwordErrors.newPassword.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                {...registerPassword('confirmPassword', { required: 'Please confirm your password' })}
                                type="password"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              {passwordErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                  {passwordErrors.confirmPassword.message}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                              >
                                <Save className="w-4 h-4" />
                                Update Password
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsChangingPassword(false)
                                  resetPassword()
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Two-Factor Authentication */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Add an extra layer of security</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Require a code in addition to your password</p>
                          </div>
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            onClick={() => setSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notification Preferences
                    </h2>

                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                        { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional offers and updates' },
                        { key: 'orderUpdates', label: 'Order Updates', description: 'Get notified about your order status' },
                        { key: 'securityAlerts', label: 'Security Alerts', description: 'Get notified about security events' },
                        { key: 'promotionalEmails', label: 'Promotional Emails', description: 'Receive special offers and discounts' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                          </div>
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings[key as keyof AccountSettings] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof AccountSettings] }))}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings[key as keyof AccountSettings] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={onSettingsSubmit}
                        className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                      >
                        Save Notification Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Section */}
                {activeSection === 'privacy' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Privacy Settings
                    </h2>

                    <div className="space-y-6">
                      {/* Profile Visibility */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          value={settings.profileVisibility}
                          onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="friends">Friends Only</option>
                        </select>
                      </div>

                      {/* Privacy Toggles */}
                      {[
                        { key: 'showOnlineStatus', label: 'Show Online Status', description: 'Let others see when you are online' },
                        { key: 'allowDirectMessages', label: 'Allow Direct Messages', description: 'Let other users send you messages' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                          </div>
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings[key as keyof AccountSettings] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof AccountSettings] }))}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings[key as keyof AccountSettings] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}

                      <div className="mt-6">
                        <button
                          onClick={onSettingsSubmit}
                          className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                        >
                          Save Privacy Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Section */}
                {activeSection === 'wallet' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Wallet Information
                    </h2>

                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Balance</p>
                        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {wallet ? `${parseFloat(wallet.balance).toFixed(2)} ${wallet.currency}` : '0.00 POINTS'}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Link
                          href="/wallet/deposit"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                        >
                          <CreditCard className="w-5 h-5" />
                          Add Funds
                        </Link>
                        <Link
                          href="/wallet/withdraw"
                          className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                          <Download className="w-5 h-5" />
                          Withdraw
                        </Link>
                      </div>

                      <Link
                        href="/wallet"
                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition"
                      >
                        <Package className="w-4 h-4" />
                        View Transaction History
                      </Link>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {activeSection === 'danger' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-6">
                    <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </h2>

                    <div className="space-y-6">
                      {/* Export Data */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export Your Data</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Download a copy of your personal data
                        </p>
                        <button
                          onClick={handleExportData}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                          <Download className="w-4 h-4" />
                          Export Data
                        </button>
                      </div>

                      {/* Delete Account */}
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
