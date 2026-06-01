import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

interface ServiceItem {
  id: string
  title: string
  description: string
  category: string
  price: string | number
  deliveryTime: number
}

export default function MyServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent('/freelance/services')}`
      return
    }
    Promise.all([fetchProfile(), fetchMyServices()]).finally(() => setLoading(false))
  }, [])

  const fetchProfile = async () => {
    setProfileLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/freelance/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const p = res.data?.profile
      const isComplete = !!(p && ((p.bio && p.bio.trim() !== '') || (Array.isArray(p.skills) && p.skills.length > 0)))
      setProfileComplete(isComplete)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setProfileComplete(false)
      } else {
        toast.error(err.response?.data?.message || 'Failed to load profile')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchMyServices = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user?.id) return
      const res = await axios.get(`/api/freelance/services?freelancerId=${encodeURIComponent(user.id)}`)
      setServices(res.data?.services || [])
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load services')
    }
  }

  return (
    <>
      <Head>
        <title>My Services - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Services</h1>
              <p className="text-gray-600 dark:text-gray-300">Create and manage the services you offer.</p>
            </div>
            <Link
              href="/freelance/create-service"
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${profileComplete ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'}`}
              onClick={(e) => {
                if (!profileComplete) {
                  e.preventDefault()
                }
              }}
            >
              Create Service
            </Link>
          </div>

          {profileLoading ? null : !profileComplete && (
            <div className="mb-6 p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Complete your freelancer profile</p>
                  <p className="text-sm">You need a bio or at least one skill to start creating services.</p>
                </div>
                <Link href="/freelance/profile" className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Complete Profile</Link>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300">You have not created any services yet.</p>
              <div className="mt-4">
                <Link
                  href="/freelance/create-service"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${profileComplete ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'}`}
                  onClick={(e) => {
                    if (!profileComplete) e.preventDefault()
                  }}
                >
                  Create your first service
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((s) => (
                <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                    <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{s.category}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{s.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Price: <span className="font-semibold">{typeof s.price === 'string' ? parseFloat(s.price).toFixed(2) : s.price.toFixed(2)}</span></span>
                    <span>Delivery: <span className="font-semibold">{s.deliveryTime} days</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
