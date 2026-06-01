import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  User,
  Shield,
  Bell,
  Lock,
  Eye,
  Palette,
  Save,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Moon,
  Sun,
  Monitor,
  Settings,
  Download,
  Trash2,
  Activity,
  Smartphone,
  CreditCard,
  Key,
  Clock,
  Twitter,
  Github,
  Linkedin,
  Globe as GlobeIcon,
  MessageSquare,
  Users,
  LayoutGrid
} from 'lucide-react'
import UserProfileMenu from '../components/UserProfileMenu'
import AIAssistantButton from '../components/AIAssistantButton'
import { useTheme } from '../contexts/ThemeContext'

interface User {
  id: string
  email: string
  username: string
  phone?: string
  role: string
  publicId?: string
}

interface Settings {
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  promotionalEmails: boolean
  darkMode: boolean
  language: string
  timezone: string
  dateFormat: string
  timeFormat: string
  currency: string
  twoFactorEnabled: boolean
  profileVisibility: 'public' | 'private' | 'friends'
  emailFrequency: 'immediate' | 'daily' | 'weekly'
  autoSave: boolean
  showOnlineStatus: boolean
  allowDirectMessages: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const { theme, setTheme, colorScheme, setColorScheme, themePreset, setThemePreset } = useTheme()
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    orderUpdates: true,
    securityAlerts: true,
    promotionalEmails: false,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    twoFactorEnabled: false,
    profileVisibility: 'public',
    emailFrequency: 'immediate',
    autoSave: true,
    showOnlineStatus: true,
    allowDirectMessages: true
  })
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Set active tab from query param
    if (router.query.tab && typeof router.query.tab === 'string') {
      setActiveTab(router.query.tab)
    }

    fetchUserData()
    fetchSettings()
  }, [router])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const u = response.data?.user ?? response.data
      if (!u) throw new Error('Invalid user response')
      setUser(u)
      setProfileData(prev => ({
        ...prev,
        username: u.username || '',
        email: u.email || '',
        phone: u.phone || '',
        bio: u.bio || '',
        website: u.website || '',
        twitter: u.twitter || '',
        linkedin: u.linkedin || '',
        github: u.github || ''
      }))
    } catch (error) {
      toast.error('Failed to load user data')
    }
  }

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(response.data.settings)
    } catch (error) {
      // Settings not found, use defaults
      console.log('Using default settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (section: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put('/api/settings', {
        section,
        settings: section === 'all' ? settings : { [section]: settings[section as keyof Settings] }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Settings saved successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings')
    }
  }

  const updateProfile = async () => {
    try {
      // Validate username
      if (profileData.username.trim().length < 3) {
        toast.error('Username must be at least 3 characters')
        return
      }

      if (profileData.username.trim().length > 30) {
        toast.error('Username must be less than 30 characters')
        return
      }

      // Validate username format (alphanumeric, underscore, hyphen)
      const usernameRegex = /^[a-zA-Z0-9_-]+$/
      if (!usernameRegex.test(profileData.username.trim())) {
        toast.error('Username can only contain letters, numbers, underscores, and hyphens')
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication token not found. Please log in again.')
        router.push('/auth/login')
        return
      }

      // Prepare data - only include non-empty fields
      const updateData: any = {
        username: profileData.username.trim(),
      }

      // Only include phone if it's not empty
      if (profileData.phone.trim()) {
        updateData.phone = profileData.phone.trim()
      }

      // Only include other fields if they're not empty
      if (profileData.bio.trim()) {
        updateData.bio = profileData.bio.trim()
      }
      if (profileData.website.trim()) {
        updateData.website = profileData.website.trim()
      }
      if (profileData.twitter.trim()) {
        updateData.twitter = profileData.twitter.trim()
      }
      if (profileData.linkedin.trim()) {
        updateData.linkedin = profileData.linkedin.trim()
      }
      if (profileData.github.trim()) {
        updateData.github = profileData.github.trim()
      }

      console.log('Updating profile with data:', updateData)

      const response = await axios.put('/api/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Profile update response:', response.data)
      toast.success('Profile updated successfully!')
      fetchUserData()
    } catch (error: any) {
      console.error('Profile update error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.')
        router.push('/auth/login')
        return
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid data provided'
        if (errorMessage.includes('Username already taken')) {
          toast.error('This username is already taken. Please choose another one.')
        } else if (errorMessage.includes('Phone number already in use')) {
          toast.error('This phone number is already in use. Please use another one.')
        } else if (errorMessage.includes('Invalid phone number format')) {
          toast.error('Invalid phone number format. Please enter a valid phone number.')
        } else if (errorMessage.includes('Username must be at least 3 characters')) {
          toast.error('Username must be at least 3 characters long.')
        } else {
          toast.error(errorMessage)
        }
        return
      }
      
      if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.')
        return
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        toast.error('Cannot connect to server. Please check your internet connection.')
        return
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
      toast.error(errorMessage)
    }
  }

  const changePassword = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (profileData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.put('/api/auth/change-password', {
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Password changed successfully!')
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  const toggleSetting = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Settings - The Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300 hidden md:block">
                  Settings
                </span>
                <UserProfileMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Account Settings
            </h1>

            <div className="grid md:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="md:col-span-1">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'privacy', label: 'Privacy', icon: Eye },
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'themes', label: 'Themes', icon: LayoutGrid },
                    { id: 'account', label: 'Account', icon: Settings }
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'themes') {
                            router.push('/settings/themes')
                          } else {
                            setActiveTab(tab.id)
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="md:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  {/* Profile Settings */}
                  {activeTab === 'profile' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <User className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
                      </div>

                      {user?.publicId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">ID: {user.publicId}</p>
                      )}

                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Username
                            </label>
                            <input
                              type="text"
                              value={profileData.username}
                              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                profileData.username.length > 0 && profileData.username.length < 3
                                  ? 'border-red-300 focus:border-red-500'
                                  : profileData.username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(profileData.username)
                                  ? 'border-green-300 focus:border-green-500'
                                  : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                              }`}
                              placeholder="Enter username (3-30 characters)"
                            />
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {profileData.username.length === 0 && "Username must be 3-30 characters, letters, numbers, underscores, and hyphens only"}
                              {profileData.username.length > 0 && profileData.username.length < 3 && (
                                <span className="text-red-500">Username must be at least 3 characters</span>
                              )}
                              {profileData.username.length >= 3 && profileData.username.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(profileData.username) && (
                                <span className="text-green-500">Username is available and valid</span>
                              )}
                              {profileData.username.length > 30 && (
                                <span className="text-red-500">Username must be less than 30 characters</span>
                              )}
                              {profileData.username.length >= 3 && !/^[a-zA-Z0-9_-]+$/.test(profileData.username) && profileData.username.length <= 30 && (
                                <span className="text-red-500">Only letters, numbers, underscores, and hyphens allowed</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              profileData.phone.length > 0 && !/^[\+]?[1-9][\d\-\s\(\)]{0,20}$/.test(profileData.phone)
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
                            }`}
                            placeholder="+1 (555) 123-4567 or leave empty"
                          />
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {profileData.phone.length === 0 && "Optional: Enter your phone number or leave empty"}
                            {profileData.phone.length > 0 && !/^[\+]?[1-9][\d\-\s\(\)]{0,20}$/.test(profileData.phone) && (
                              <span className="text-red-500">Please enter a valid phone number</span>
                            )}
                            {profileData.phone.length > 0 && /^[\+]?[1-9][\d\-\s\(\)]{0,20}$/.test(profileData.phone) && (
                              <span className="text-green-500">Valid phone number format</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bio
                          </label>
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Tell us about yourself..."
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/500 characters</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={profileData.website}
                              onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Twitter className="w-4 h-4 inline mr-1" />
                              Twitter
                            </label>
                            <input
                              type="text"
                              value={profileData.twitter}
                              onChange={(e) => setProfileData(prev => ({ ...prev, twitter: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="@username"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Linkedin className="w-4 h-4 inline mr-1" />
                              LinkedIn
                            </label>
                            <input
                              type="text"
                              value={profileData.linkedin}
                              onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="linkedin.com/in/username"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              <Github className="w-4 h-4 inline mr-1" />
                              GitHub
                            </label>
                            <input
                              type="text"
                              value={profileData.github}
                              onChange={(e) => setProfileData(prev => ({ ...prev, github: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="github.com/username"
                            />
                          </div>
                        </div>

                        <button
                          onClick={updateProfile}
                          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Profile Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Change Password */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                              </label>
                              <input
                                type="password"
                                value={profileData.currentPassword}
                                onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  New Password
                                </label>
                                <input
                                  type="password"
                                  value={profileData.newPassword}
                                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Confirm New Password
                                </label>
                                <input
                                  type="password"
                                  value={profileData.confirmPassword}
                                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                            <button
                              onClick={changePassword}
                              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
                            >
                              <Lock className="w-4 h-4" />
                              Change Password
                            </button>
                          </div>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-700 dark:text-gray-300">Add an extra layer of security to your account</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Requires authenticator app</p>
                            </div>
                            <button
                              onClick={() => toast('2FA setup coming soon!')}
                              className={`px-4 py-2 rounded-lg transition ${
                                settings.twoFactorEnabled
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {settings.twoFactorEnabled ? 'Enabled' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification Settings */}
                  {activeTab === 'notifications' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.emailNotifications}
                              onChange={() => toggleSetting('emailNotifications')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via SMS</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.smsNotifications}
                              onChange={() => toggleSetting('smsNotifications')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Order Updates</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Notifications about your orders and purchases</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.orderUpdates}
                              onChange={() => toggleSetting('orderUpdates')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Security Alerts</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Important security notifications and login alerts</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.securityAlerts}
                              onChange={() => toggleSetting('securityAlerts')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Marketing Emails</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Receive promotional emails and updates</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.promotionalEmails}
                              onChange={() => toggleSetting('promotionalEmails')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Email Frequency
                          </label>
                          <select
                            value={settings.emailFrequency}
                            onChange={(e) => setSettings(prev => ({ ...prev, emailFrequency: e.target.value as any }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily Digest</option>
                            <option value="weekly">Weekly Summary</option>
                          </select>
                        </div>

                        <button
                          onClick={() => saveSettings('notifications')}
                          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Notification Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Privacy Settings */}
                  {activeTab === 'privacy' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Eye className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Profile Visibility
                          </label>
                          <div className="space-y-2">
                            {[
                              { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                              { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                              { value: 'friends', label: 'Friends Only', desc: 'Only approved connections can see' }
                            ].map((option) => (
                              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="profileVisibility"
                                  value={option.value}
                                  checked={settings.profileVisibility === option.value}
                                  onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value as any }))}
                                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Activity className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Show Online Status</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you're online</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.showOnlineStatus}
                                onChange={() => toggleSetting('showOnlineStatus')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Allow Direct Messages</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Let other users send you direct messages</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.allowDirectMessages}
                              onChange={() => toggleSetting('allowDirectMessages')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <button
                          onClick={() => saveSettings('privacy')}
                          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Privacy Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Appearance Settings */}
                  {activeTab === 'appearance' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Palette className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Theme
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'system', label: 'Auto', icon: Monitor }
                            ].map((mode) => {
                              const Icon = mode.icon
                              return (
                                <button
                                  key={mode.value.toString()}
                                  onClick={() => setTheme(mode.value as any)}
                                  className={`p-4 border-2 rounded-lg text-center transition ${
                                    theme === (mode.value as any)
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                                  <p className="font-medium text-gray-900 dark:text-white">{mode.label}</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Theme Presets</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">Browse many visual styles (fonts, icons, layouts)</div>
                          </div>
                          <button
                            onClick={() => router.push('/settings/themes')}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          >
                            Open Themes
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Language
                            </label>
                            <select
                              value={settings.language}
                              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="en">English</option>
                              <option value="es">Español</option>
                              <option value="fr">Français</option>
                              <option value="de">Deutsch</option>
                              <option value="it">Italiano</option>
                              <option value="pt">Português</option>
                              <option value="ru">Русский</option>
                              <option value="zh">中文</option>
                              <option value="ja">日本語</option>
                              <option value="ko">한국어</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Timezone
                            </label>
                            <select
                              value={settings.timezone}
                              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">Eastern Time (ET)</option>
                              <option value="America/Chicago">Central Time (CT)</option>
                              <option value="America/Denver">Mountain Time (MT)</option>
                              <option value="America/Los_Angeles">Pacific Time (PT)</option>
                              <option value="Europe/London">London (GMT)</option>
                              <option value="Europe/Paris">Paris (CET)</option>
                              <option value="Europe/Berlin">Berlin (CET)</option>
                              <option value="Asia/Tokyo">Tokyo (JST)</option>
                              <option value="Asia/Shanghai">Shanghai (CST)</option>
                              <option value="Asia/Dubai">Dubai (GST)</option>
                              <option value="Australia/Sydney">Sydney (AEST)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Color Scheme
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: 'Blue', value: 'blue' as const, color: '#0ea5e9' },
                                { name: 'Purple', value: 'purple' as const, color: '#8b5cf6' },
                                { name: 'Green', value: 'green' as const, color: '#10b981' },
                                { name: 'Orange', value: 'orange' as const, color: '#f59e0b' },
                                { name: 'Red', value: 'red' as const, color: '#ef4444' },
                              ].map((scheme) => (
                                <button
                                  key={scheme.value}
                                  onClick={() => setColorScheme(scheme.value)}
                                  className={`w-full h-12 rounded-lg border-2 transition-all ${
                                    colorScheme === scheme.value
                                      ? 'border-gray-900 dark:border-white scale-110'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
                                  style={{ backgroundColor: scheme.color }}
                                  title={scheme.name}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Date Format
                            </label>
                            <select
                              value={settings.dateFormat}
                              onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              <option value="DD MMM YYYY">DD MMM YYYY</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Time Format
                            </label>
                            <select
                              value={settings.timeFormat}
                              onChange={(e) => setSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="12h">12 Hour</option>
                              <option value="24h">24 Hour</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Currency
                            </label>
                            <select
                              value={settings.currency}
                              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="JPY">JPY (¥)</option>
                              <option value="CAD">CAD (C$)</option>
                              <option value="AUD">AUD (A$)</option>
                              <option value="CHF">CHF (Fr)</option>
                              <option value="CNY">CNY (¥)</option>
                              <option value="INR">INR (₹)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="flex items-center gap-3">
                            <Save className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Auto-save Settings</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save your settings as you change them</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.autoSave}
                              onChange={() => toggleSetting('autoSave')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>

                        <button
                          onClick={() => saveSettings('appearance')}
                          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Appearance Settings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Account Settings */}
                  {activeTab === 'account' && (
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
                      </div>

                      <div className="space-y-8">
                        {/* Data Export */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Export Your Data</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of all your data</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toast('Data export feature coming soon!')}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                              >
                                Export
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Login History</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">View your recent login activity</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toast('Login history feature coming soon!')}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              >
                                View History
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Connected Devices */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Devices</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active login sessions</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toast('Session management coming soon!')}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              >
                                Manage
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* API & Integrations */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API & Integrations</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Key className="w-5 h-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">API Keys</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your API access keys</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toast('API key management coming soon!')}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              >
                                Manage Keys
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-red-200 dark:border-red-800 pt-6">
                          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                              <div className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Deactivate Account</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Temporarily disable your account</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to deactivate your account? This will temporarily disable your access.')) {
                                    toast('Account deactivation feature coming soon!');
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                Deactivate
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                              <div className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                                    toast.error('Account deletion requires contacting support.');
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <AIAssistantButton />
      </div>
    </>
  )
}


