import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Plus, Package, Edit2, Trash2, Eye, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'
import UserProfileMenu from '../../components/UserProfileMenu'
import AIAssistantButton from '../../components/AIAssistantButton'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: string
  stock: number
  condition: string
  images: string[]
  isActive: boolean
  createdAt: string
  _count: {
    orders: number
  }
}

export default function SellerDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to access seller dashboard')
      router.push('/auth/login')
      return
    }

    fetchProducts()
    fetchStats()
  }, [router, currentPage])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/products/seller/my', {
        params: {
          page: currentPage,
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setProducts(response.data.products || [])
      setTotalPages(response.data.pagination?.pages || 1)
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/auth/login')
      } else {
        toast.error('Failed to load products')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/products/seller/my', {
        params: { page: 1, limit: 1000 },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const allProducts = response.data.products || []
      const activeProducts = allProducts.filter((p: Product) => p.isActive)
      const totalOrders = allProducts.reduce((sum: number, p: Product) => sum + (p._count?.orders || 0), 0)
      
      setStats({
        totalProducts: allProducts.length,
        activeProducts: activeProducts.length,
        totalOrders,
        totalRevenue: 0 // Would need to calculate from orders
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success('Product deleted successfully')
      fetchProducts()
      fetchStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product')
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `/api/products/${product.id}`,
        {
          isActive: !product.isActive
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`)
      fetchProducts()
      fetchStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product')
    }
  }

  return (
    <>
      <Head>
        <title>Seller Dashboard - The Bridge</title>
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
              <div className="flex items-center gap-4">
                <Link
                  href="/products"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  Browse Shop
                </Link>
                <UserProfileMenu variant="profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Seller Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage your products and track your sales
                </p>
              </div>
              <Link
                href="/products/new"
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition font-semibold"
              >
                <Plus className="w-5 h-5" />
                List New Product
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.activeProducts}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Products
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No products yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                  Start selling by listing your first product
                </p>
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                >
                  <Plus className="w-5 h-5" />
                  List Your First Product
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <div key={product.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Category: <span className="font-medium">{product.category}</span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Condition: <span className="font-medium">
                                  {product.condition === 'BRAND_NEW' ? 'Brand New' : product.condition === 'SLIGHTLY_USED' ? 'Slightly Used' : 'Used'}
                                </span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Stock: <span className="font-medium">{product.stock}</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                              {parseFloat(product.price).toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  product.isActive
                                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {product._count?.orders || 0} orders
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <Link
                            href={`/products/${product.id}`}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => toggleProductStatus(product)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm transition ${
                              product.isActive
                                ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300'
                                : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                            }`}
                          >
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
        <AIAssistantButton />
      </div>
    </>
  )
}

