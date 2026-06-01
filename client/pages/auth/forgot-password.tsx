import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) {
      toast.error('Enter your email')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email: value })
      toast.success('If the email exists, a reset link will be sent.')
      setEmail('')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to request reset link'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password - The Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Enter your email and we’ll send you a reset link.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 dark:bg-primary-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Remembered your password?{' '}
              <Link href="/auth/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
