import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Wallet, Package, ShoppingCart, MessageSquare, Settings, BarChart3, ShoppingBag, Sun, Moon, Palette } from 'lucide-react'
import AIAssistantButton from '../components/AIAssistantButton'
import UserProfileMenu from '../components/UserProfileMenu'
import SearchBar from '../components/SearchBar'
import { useTheme } from '../contexts/ThemeContext'

interface User {
  id: string
  email: string
  username: string
  role: string
}

interface WalletData {
  balance: string
  currency: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [colorOpen, setColorOpen] = useState(false)
  const { colorScheme, setColorScheme, isDark, toggleTheme } = useTheme()

  const DASH_CACHE_KEY = 'dashboard_cache_v1'
  const DASH_CACHE_TTL_MS = 60 * 1000

  const colorSchemes = [
    { name: 'Blue', value: 'blue' as const, color: '#0ea5e9' },
    { name: 'Purple', value: 'purple' as const, color: '#8b5cf6' },
    { name: 'Green', value: 'green' as const, color: '#10b981' },
    { name: 'Orange', value: 'orange' as const, color: '#f59e0b' },
    { name: 'Red', value: 'red' as const, color: '#ef4444' },
  ]

  // Theme is managed by ThemeContext; no local initialization needed

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      const raw = localStorage.getItem(DASH_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.ts && (Date.now() - parsed.ts) < DASH_CACHE_TTL_MS) {
          if (parsed.user) setUser(parsed.user)
          if (parsed.wallet) setWallet(parsed.wallet)
          setIsLoading(false)
        }
      }
    } catch {
      // ignore cache parse errors
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const u = response.data?.user ?? response.data
        setUser(u)
        return u as User
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
        } else {
          toast.error('Failed to load user data')
        }
        return null
      }
    }

    // Fetch wallet data
    const fetchWalletData = async () => {
      try {
        const response = await axios.get('/api/wallet/balance', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        setWallet(response.data)
        return response.data as WalletData
      } catch (error: any) {
        console.error('Failed to load wallet:', error)
        return null
      } finally {
        setIsLoading(false)
      }
    }

    ;(async () => {
      const [u, w] = await Promise.all([fetchUserData(), fetchWalletData()])
      try {
        localStorage.setItem(DASH_CACHE_KEY, JSON.stringify({ ts: Date.now(), user: u, wallet: w }))
      } catch {
        // ignore cache write errors
      }
    })()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Dashboard - The Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <header className="relative bg-bridge-hero border-b border-gray-200/70 dark:border-white/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-theme-primary-soft blur-3xl opacity-70" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-theme-primary-soft blur-3xl opacity-50" />
            <div className="absolute inset-0 bg-white/30 dark:bg-black/35" />
          </div>

          <div className="container mx-auto px-4 py-5 relative">
            <div className="flex items-center justify-between">
              <Link href="/" className="bridge-title text-2xl font-bold text-gray-900 dark:text-white">
                <span className="theme-primary">The</span> Bridge
              </Link>
              
              {/* Global Search Bar */}
              <div className="hidden md:block flex-1 max-w-lg mx-8">
                <SearchBar 
                  placeholder="Search products, services, freelancers..." 
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <span className="text-gray-600 dark:text-gray-300 hidden md:block">
                  Welcome, {user?.username || user?.email}
                </span>
                <UserProfileMenu />
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="md:hidden mt-4">
              <SearchBar 
                placeholder="Search products, services, freelancers..." 
                className="w-full"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Dashboard
          </h1>

          {/* Wallet Card */}
          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 mb-6 border border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Wallet Balance
                </h2>
                <p className="text-3xl font-bold theme-primary">
                  {wallet ? `${parseFloat(wallet.balance).toFixed(2)} ${wallet.currency}` : '0.00 POINTS'}
                </p>
              </div>
              <Wallet className="w-12 h-12 theme-primary icon-draw icon-animate-once" />
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/wallet/deposit"
                className="px-4 py-2 bg-theme-primary text-white rounded-xl hover:opacity-95 hover-lift shadow-theme-primary-soft"
              >
                Deposit
              </Link>
              <Link
                href="/wallet/withdraw"
                className="px-4 py-2 glass rounded-xl hover-lift border border-black/5 dark:border-white/10 text-gray-900 dark:text-white"
              >
                Withdraw
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/smm"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <BarChart3 className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Social Boost
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Order social media services
              </p>
            </Link>

            <Link
              href="/shop"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <ShoppingBag className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Shop
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse and purchase products
              </p>
            </Link>

            <Link
              href="/freelance"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <ShoppingCart className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Jobs
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Find professionals or offer services
              </p>
            </Link>

            <Link
              href="/chat"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <MessageSquare className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Messages
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                View your conversations
              </p>
            </Link>

            <Link
              href="/seller"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <Package className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Seller Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your products and sales
              </p>
            </Link>

            <Link
              href="/settings"
              className="group glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 hover-lift border border-black/5 dark:border-white/10"
            >
              <Settings className="w-8 h-8 theme-primary mb-3 icon-draw icon-animate-once icon-animate-hover" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Settings
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your account settings
              </p>
            </Link>
          </div>
        </main>
        <AIAssistantButton />
      </div>
    </>
  )
}

