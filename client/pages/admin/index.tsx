import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Shield, RefreshCw, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

type AdminDeposit = {
  id: string
  type: string
  amount: string
  currency: string
  status: string
  paymentMethod: string
  metadata?: any
  createdAt: string
  user?: {
    id: string
    email?: string | null
    username?: string | null
  }
}

export default function AdminPanelPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING')
  const [deposits, setDeposits] = useState<AdminDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }, [])

  const load = async (isRefresh = false) => {
    if (!token) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await axios.get('/api/wallet/admin/deposits', {
        params: { status, limit: 50 },
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeposits(res.data?.transactions ?? [])
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to load deposits'
      toast.error(msg)
      if (e?.response?.status === 401) router.push('/auth/login')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!token) {
      router.push('/auth/login')
      return
    }
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, token, status])

  const approve = async (id: string) => {
    if (!token) return
    setActingId(id)
    try {
      await axios.post(
        `/api/wallet/admin/deposits/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Deposit approved')
      await load(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to approve deposit')
    } finally {
      setActingId(null)
    }
  }

  const reject = async (id: string) => {
    if (!token) return
    const reason = window.prompt('Reject reason (optional):') || ''
    setActingId(id)
    try {
      await axios.post(
        `/api/wallet/admin/deposits/${id}/reject`,
        reason.trim() ? { reason: reason.trim() } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Deposit rejected')
      await load(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to reject deposit')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Deposits</title>
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 theme-primary" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Review and approve manual deposit requests.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-black/5 dark:border-white/10 text-gray-900 dark:text-white hover-lift"
              >
                <ArrowLeft className="w-5 h-5" />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-black/5 dark:border-white/10 text-gray-900 dark:text-white hover-lift disabled:opacity-60"
              >
                <RefreshCw className={refreshing ? 'w-5 h-5 animate-spin' : 'w-5 h-5'} />
                Refresh
              </button>
            </div>
          </div>

          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 border border-black/5 dark:border-white/10 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Showing deposits with status</div>
                <div className="mt-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-4 py-2 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <Link href="/wallet" className="text-sm theme-primary hover:underline">
                View wallet
              </Link>
            </div>
          </div>

          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 border border-black/5 dark:border-white/10">
            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">Loading…</div>
            ) : deposits.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-300">No deposits found.</div>
            ) : (
              <div className="space-y-3">
                {deposits.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl border border-black/5 dark:border-white/10"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {d.user?.username || d.user?.email || d.user?.id || 'Unknown user'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(d.createdAt).toLocaleString()} • {d.status} • {d.paymentMethod}
                        </div>
                        {d?.metadata?.reference ? (
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Reference: {String(d.metadata.reference)}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {parseFloat(d.amount).toFixed(2)} {d.currency}
                        </div>

                        {status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => approve(d.id)}
                              disabled={actingId === d.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-primary text-white hover:opacity-95 disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => reject(d.id)}
                              disabled={actingId === d.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass border border-black/5 dark:border-white/10 text-gray-900 dark:text-white hover-lift disabled:opacity-60"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
