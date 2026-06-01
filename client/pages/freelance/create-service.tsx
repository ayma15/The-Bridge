import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function CreateServicePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }
    checkProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/freelance/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const p = res.data?.profile
      const isComplete = !!(p && ((p.bio && p.bio.trim() !== '') || (Array.isArray(p.skills) && p.skills.length > 0)))
      setProfileComplete(isComplete)
      if (!isComplete) {
        toast.error('Please complete your freelancer profile first.')
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setProfileComplete(false)
        toast.error('Please complete your freelancer profile first.')
      } else {
        toast.error(err.response?.data?.message || 'Failed to verify profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileComplete) {
      router.push('/freelance/profile')
      return
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/freelance/services', {
        title,
        description,
        category,
        price: parseFloat(price || '0'),
        deliveryTime: parseInt(deliveryTime || '0', 10)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Service created successfully')
      router.push('/freelance/services')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create service')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Create Service - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create a Service</h1>
              <p className="text-gray-600 dark:text-gray-300">Describe what you offer and set your price and delivery time.</p>
            </div>
          </div>

          {!profileComplete && (
            <div className="mb-6 p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Complete your freelancer profile</p>
                  <p className="text-sm">Add a bio or at least one skill before creating services.</p>
                </div>
                <button onClick={() => router.push('/freelance/profile')} className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Complete Profile</button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Build a modern React website"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain your service, what's included, and your process"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Web Development, Design, Writing"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 99.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Time (days)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 7"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/freelance/services')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!profileComplete || submitting}
                className={`px-6 py-2 rounded-lg text-white font-semibold ${profileComplete ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                {submitting ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
