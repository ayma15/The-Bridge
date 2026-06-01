import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ArrowDownCircle } from 'lucide-react'

const CURRENCIES = ['ETB', 'USD'] as const
const PAYMENT_METHODS = [
  { value: 'TELEBIRR', label: 'Telebirr' },
  { value: 'CBEBIRR', label: 'CBE Birr' },
  { value: 'CBE', label: 'CBE' }
] as const

type Currency = (typeof CURRENCIES)[number]

type DepositResponse = {
  message: string
  transaction: {
    id: string
    amount: string
    currency: string
    status: string
    paymentMethod: string
  }
}

export default function WalletDepositPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('ETB')
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]['value']>('TELEBIRR')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }, [])

  useEffect(() => {
    if (!token) {
      router.push('/auth/login')
    }
  }, [router, token])

  const submit = async () => {
    if (!token) return
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    setSubmitting(true)
    try {
      const res = await axios.post<DepositResponse>(
        '/api/wallet/deposit',
        {
          amount: amt,
          currency,
          paymentMethod,
          reference: reference.trim() ? reference.trim() : undefined,
          note: note.trim() ? note.trim() : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast.success('Deposit request submitted (Pending approval)')
      const txId = res.data?.transaction?.id
      if (txId) {
        setAmount('')
        setReference('')
        setNote('')
      }
      router.push('/wallet')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit deposit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Deposit - Wallet</title>
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-black/5 dark:border-white/10 text-gray-900 dark:text-white hover-lift"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </div>

          <div className="glass bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-theme-primary-soft p-6 border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownCircle className="w-7 h-7 theme-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Funds (Manual)</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Reference (optional)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction ID / phone / receipt number"
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any details for admin verification…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="px-6 py-3 bg-theme-primary text-white rounded-xl hover:opacity-95 hover-lift shadow-theme-primary-soft disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Deposit Request'}
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Your request will be marked as <span className="font-semibold">PENDING</span> until an admin approves it.
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
