import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Package, X, Image as ImageIcon } from 'lucide-react'
import UserProfileMenu from '../../../components/UserProfileMenu'
import AIAssistantButton from '../../../components/AIAssistantButton'

interface ProductFormData {
  name: string
  description: string
  category: string
  price: string
  stock: string
  condition: string
  images: string[]
  isActive: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const { id } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fixed categories list (fallback if API fails)
  const FIXED_CATEGORIES = [
    'Electronics',
    'Computers & Accessories',
    'Phones & Accessories',
    'Home & Garden',
    'Fashion & Clothing',
    'Shoes & Accessories',
    'Beauty & Personal Care',
    'Health & Fitness',
    'Sports & Outdoors',
    'Toys & Games',
    'Books & Media',
    'Automotive',
    'Pet Supplies',
    'Food & Beverages',
    'Office Supplies',
    'Tools & Hardware',
    'Musical Instruments',
    'Art & Crafts',
    'Baby & Kids',
    'Jewelry & Watches',
    'Collectibles',
    'Other'
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<ProductFormData>()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchCategories()
    if (id) {
      fetchProduct()
    }
  }, [id, router])

  useEffect(() => {
    setValue('images', imageUrls)
  }, [imageUrls, setValue])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/products/categories/list')
      setCategories(response.data.categories || FIXED_CATEGORIES)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Use fallback categories if API fails
      setCategories(FIXED_CATEGORIES)
    }
  }

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/products/${id}`)
      const product = response.data.product
      setImageUrls(product.images || [])
      reset({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        stock: product.stock.toString(),
        images: product.images || [],
        isActive: product.isActive
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load product')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImage = async (token: string) => {
    if (!selectedFile) return null
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      const res = await axios.post('/api/products/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return res.data?.url as string
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      let uploadedUrl: string | null = null
      if (selectedFile) {
        uploadedUrl = await uploadImage(token)
      }

      const productData = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        images: uploadedUrl ? [uploadedUrl] : imageUrls
      }

      await axios.put(`/api/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success('Product updated successfully!')
      router.push(`/products/${id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product')
    } finally {
      setIsSaving(false)
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

  return (
    <>
      <Head>
        <title>Edit Product - Shop - The Bridge</title>
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
                  href={`/products/${id}`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Product</span>
                </Link>
                <UserProfileMenu variant="profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Edit Product
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Update your product information
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  {...register('name', {
                    required: 'Product name is required',
                    minLength: {
                      value: 3,
                      message: 'Product name must be at least 3 characters'
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters'
                    }
                  })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a category</option>
                  {(categories.length > 0 ? categories : FIXED_CATEGORIES).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition *
                </label>
                <select
                  {...register('condition', { required: 'Condition is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="BRAND_NEW">Brand New</option>
                  <option value="SLIGHTLY_USED">Slightly Used</option>
                  <option value="USED">Used</option>
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.condition.message}
                  </p>
                )}
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    {...register('price', {
                      required: 'Price is required',
                      min: {
                        value: 0.01,
                        message: 'Price must be at least 0.01'
                      }
                    })}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    {...register('stock', {
                      min: {
                        value: 0,
                        message: 'Stock cannot be negative'
                      }
                    })}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product is active (visible in shop)
                </label>
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Image (upload)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      setSelectedFile(f)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max size is limited by the server (5MB).
                  </p>

                  {selectedFile && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div className="text-sm text-gray-700 dark:text-gray-200 truncate">
                        {selectedFile.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {imageUrls.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img src={url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload a product image above
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link
                  href={`/products/${id}`}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving || uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : uploadingImage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
        <AIAssistantButton />
      </div>
    </>
  )
}

