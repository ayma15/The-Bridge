import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'

type WalletData = {
  balance: string
  currency: string
}

type Transaction = {
  id: string
  type: string
  amount: string
  currency: string
  status: string
  paymentMethod: string
  description?: string | null
  createdAt: string
}

export default function WalletPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }, [])

  useEffect(() => {
    if (!token) {
      router.push('/auth/login')
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const [balRes, txRes] = await Promise.all([
          axios.get('/api/wallet/balance', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/wallet/transactions?limit=15', { headers: { Authorization: `Bearer ${token}` } })
        ])
        setWallet(balRes.data)
        setTransactions(txRes.data?.transactions ?? [])
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to load wallet')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router, token])

  const refresh = async () => {
    if (!token) return
    setRefreshing(true)
    try {
      const [balRes, txRes] = await Promise.all([
        axios.get('/api/wallet/balance', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/wallet/transactions?limit=15', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setWallet(balRes.data)
      setTransactions(txRes.data?.transactions ?? [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to refresh wallet')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <Head>
        <title>Wallet - The Bridge</title>
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your balance, deposits, and withdrawals.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-black/5 dark:border-white/10 text-gray-900 dark:text-white hover-lift disabled:opacity-60"
            >
              <RefreshCw className={refreshing ? 'w-5 h-5 animate-spin' : 'w-5 h-5'} />
              Refresh
            </button>
          </div>

          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 border border-black/5 dark:border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Current Balance</div>
                <div className="mt-2 text-3xl font-bold theme-primary">
                  {wallet ? `${parseFloat(wallet.balance).toFixed(2)} ${wallet.currency}` : '—'}
                </div>
              </div>
              <Wallet className="w-12 h-12 theme-primary" />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/wallet/deposit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-theme-primary text-white rounded-xl hover:opacity-95 hover-lift shadow-theme-primary-soft"
              >
                <ArrowDownCircle className="w-5 h-5" />
                Add Funds
              </Link>
              <Link
                href="/wallet/withdraw"
                className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-xl hover-lift border border-black/5 dark:border-white/10 text-gray-900 dark:text-white"
              >
                <ArrowUpCircle className="w-5 h-5" />
                Withdraw
              </Link>
            </div>
          </div>

          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 border border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
              <Link href="/account" className="text-sm theme-primary hover:underline">Account</Link>
            </div>

            {isLoading ? (
              <div className="text-gray-600 dark:text-gray-300">Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-300">No transactions yet.</div>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-black/5 dark:border-white/10"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {t.type} • {t.paymentMethod}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(t.createdAt).toLocaleString()} • {t.status}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {parseFloat(t.amount).toFixed(2)} {t.currency}
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
