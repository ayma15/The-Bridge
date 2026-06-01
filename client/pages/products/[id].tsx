import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft, ShoppingCart, User,
  Check, X, Edit2, Trash2, Image as ImageIcon, Phone, FileText
} from 'lucide-react'
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
  seller: {
    id: string
    username: string
    email: string
    phone?: string
    sellerPhone?: string
    sellerAddress?: any
    sellerTerms?: string
  }
  createdAt: string
}

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setUserId(user.id || '')
      setUserRole(user.role || '')
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/products/${id}`)
      setProduct(response.data.product)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load product')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const getSellerPhone = () => {
    return product?.seller?.sellerPhone || product?.seller?.phone || ''
  }

  const handleRevealPhone = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to view seller contact')
      router.push('/auth/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    setShowPhone(true)
  }

  const handleMessageNow = async () => {
    if (!product) return
    if (!isAuthenticated) {
      toast.error('Please login to message the seller')
      router.push('/auth/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(
        '/api/chat/rooms',
        { participantId: product.seller.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const roomId = res.data?.room?.id
      if (!roomId) throw new Error('Room not created')
      router.push(`/chat?roomId=${encodeURIComponent(roomId)}&productId=${encodeURIComponent(String(id))}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open chat')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success('Product deleted successfully')
      router.push('/products')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) return null

  const isOwner = userId === product.seller.id
  const canEdit = isOwner || userRole === 'ADMIN' || userRole === 'FULL_ADMIN'
  

  return (
    <>
      <Head>
        <title>{product.name} - Shop - The Bridge</title>
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
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Shop</span>
                </Link>
                <UserProfileMenu variant="profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Images */}
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 mb-4">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-24 h-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index
                              ? 'border-primary-600 dark:border-primary-400'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  {/* Header with actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {product.name}
                      </h1>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                          {product.category}
                        </span>
                        {product.stock > 0 ? (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
                            <Check className="w-4 h-4" />
                            In Stock
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm">
                            <X className="w-4 h-4" />
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${id}/edit`}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={handleDelete}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price</span>
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Stock Available</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.stock} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Condition</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.condition === 'BRAND_NEW' ? 'Brand New' : product.condition === 'SLIGHTLY_USED' ? 'Slightly Used' : 'Used'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Seller</span>
                      <div className="text-right">
                        <Link
                          href={`/seller/${product.seller.id}`}
                          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline justify-end"
                        >
                          <User className="w-4 h-4" />
                          {product.seller.username}
                        </Link>
                        {product.seller && (product as any).seller.publicId && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID: {(product as any).seller.publicId}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller Information */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                      Seller Information
                    </h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Contact details are available when you click <span className="font-semibold">Order Now</span>.
                      </div>
                    </div>
                  </div>

                  {/* Order Section */}
                  {product.stock > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-900 dark:text-white">Price:</span>
                          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={handleRevealPhone}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition font-semibold"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Order Now
                        </button>

                        <button
                          onClick={handleMessageNow}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                        >
                          <FileText className="w-5 h-5" />
                          Message Now
                        </button>

                        {showPhone && getSellerPhone() && (
                          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Seller Phone</div>
                                <a
                                  href={`tel:${getSellerPhone()}`}
                                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                                >
                                  {getSellerPhone()}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
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

