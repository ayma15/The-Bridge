import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { Search, Filter, Grid, List, ShoppingCart, Package, Plus } from 'lucide-react'
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
  }
  createdAt: string
  isMockup?: boolean
}

export default function ShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setUserRole(user.role || '')
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [router.query, currentPage])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/products/categories/list')
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      }

      if (router.query.search) {
        params.search = router.query.search
        setSearchQuery(router.query.search as string)
      }

      if (router.query.category) {
        params.category = router.query.category
        setSelectedCategory(router.query.category as string)
      }

      if (router.query.condition) {
        params.condition = router.query.condition
        setSelectedCondition(router.query.condition as string)
      }

      if (router.query.minPrice) {
        params.minPrice = router.query.minPrice
        setMinPrice(router.query.minPrice as string)
      }

      if (router.query.maxPrice) {
        params.maxPrice = router.query.maxPrice
        setMaxPrice(router.query.maxPrice as string)
      }

      const response = await axios.get('/api/products', { params })
      setProducts(response.data.products || [])
      setTotalPages(response.data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push({
      pathname: '/products',
      query: { ...router.query, search: searchQuery, page: 1 }
    })
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    const newCategory = category === selectedCategory ? '' : category
    setSelectedCategory(newCategory)
    router.push({
      pathname: '/products',
      query: { ...router.query, category: newCategory, page: 1 }
    })
    setCurrentPage(1)
  }

  const handleFilterApply = () => {
    const query: any = { ...router.query, page: 1 }
    if (selectedCondition) query.condition = selectedCondition
    else delete query.condition
    if (minPrice) query.minPrice = minPrice
    else delete query.minPrice
    if (maxPrice) query.maxPrice = maxPrice
    else delete query.maxPrice
    
    router.push({
      pathname: '/products',
      query
    })
    setCurrentPage(1)
    setShowFilters(false)
  }

  const handleFilterReset = () => {
    setSelectedCondition('')
    setMinPrice('')
    setMaxPrice('')
    router.push({
      pathname: '/products',
      query: { ...router.query, condition: undefined, minPrice: undefined, maxPrice: undefined, page: 1 }
    })
    setCurrentPage(1)
  }

  return (
    <>
      <Head>
        <title>Shop - The Bridge</title>
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
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  Dashboard
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Shop
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse and purchase products from our marketplace
                </p>
              </div>
              {(isAuthenticated && (userRole === 'VENDOR' || userRole === 'ADMIN' || userRole === 'FULL_ADMIN')) && (
                <Link
                  href="/products/new"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>List Product</span>
                </Link>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    showFilters || selectedCondition || minPrice || maxPrice
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Condition Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condition
                    </label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Conditions</option>
                      <option value="BRAND_NEW">Brand New</option>
                      <option value="SLIGHTLY_USED">Slightly Used</option>
                      <option value="USED">Used</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="No limit"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleFilterApply}
                    className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={handleFilterReset}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    !selectedCategory
                      ? 'bg-primary-600 dark:bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedCategory === category
                        ? 'bg-primary-600 dark:bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No products found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }
              >
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700 overflow-hidden ${
                      viewMode === 'list' ? 'flex gap-4' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <div
                      className={`bg-gray-100 dark:bg-gray-700 relative ${
                        viewMode === 'grid' ? 'aspect-[5/4]' : 'w-26 h-26 flex-shrink-0'
                      }`}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {/* DEMO Badge for mockup products */}
                      {product.seller.username === 'admin' && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                          DEMO
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {parseFloat(product.price).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.stock} in stock
                            </p>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {product.condition === 'BRAND_NEW' ? 'New' : product.condition === 'SLIGHTLY_USED' ? 'Slightly Used' : 'Used'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          by {product.seller.username}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
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
            </>
          )}
        </main>
        <AIAssistantButton />
      </div>
    </>
  )
}

