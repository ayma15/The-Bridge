import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import SearchBar from '../components/SearchBar'
import axios from 'axios'
import Link from 'next/link'
import { Search, Package, Briefcase, Users, Megaphone, Star } from 'lucide-react'

interface SearchResult {
  query: string
  products: any[]
  services: any[]
  freelancers: any[]
  users: any[]
  ads: any[]
  total: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SearchPage() {
  const router = useRouter()
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'services' | 'freelancers' | 'ads'>('all')

  const performSearch = async (query: string, type: string = 'all', page: number = 1) => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/search', {
        params: { q: query, type, page }
      })
      setResults(response.data)
    } catch (error: any) {
      console.error('Search error:', error)
      // Set empty results on error to prevent infinite loading
      setResults({
        query,
        products: [],
        services: [],
        freelancers: [],
        users: [],
        ads: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const { q, type, page } = router.query
    if (q && typeof q === 'string') {
      performSearch(q, (type as string) || 'all', parseInt(page as string) || 1)
      if (type) setActiveTab(type as any)
    }
  }, [router.query])

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'products': return <Package className="w-4 h-4" />
      case 'services': return <Briefcase className="w-4 h-4" />
      case 'freelancers': return <Users className="w-4 h-4" />
      case 'ads': return <Megaphone className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getTabCount = (tab: string) => {
    if (!results) return 0
    switch (tab) {
      case 'products': return results.products.length
      case 'services': return results.services.length
      case 'freelancers': return results.freelancers.length
      case 'ads': return results.ads.length
      default: return results.total
    }
  }

  return (
    <>
      <Head>
        <title>Search - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Search Results
              </h1>
              <div className="max-w-2xl mx-auto">
                <SearchBar 
                  onSearch={handleSearch}
                  placeholder="Search products, services, freelancers..."
                  className="shadow-lg"
                />
              </div>
            </div>

            {router.query.q && (
              <>
                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                  {[
                    { key: 'all', label: 'All Results' },
                    { key: 'products', label: 'Products' },
                    { key: 'services', label: 'Services' },
                    { key: 'freelancers', label: 'Freelancers' },
                    { key: 'ads', label: 'Ads' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key as any)
                        performSearch(router.query.q as string, tab.key)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${
                        activeTab === tab.key 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {getTabIcon(tab.key)}
                      <span>{tab.label}</span>
                      <span className="bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">
                        {getTabCount(tab.key)}
                      </span>
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Searching across the platform...</p>
                  </div>
                ) : results ? (
                  <div className="space-y-6">
                    {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Products</h2>
                        <div className="grid gap-4">
                          {results.products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`}>
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{product.name}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{product.description}</p>
                                <p className="text-primary-600 dark:text-primary-400 font-semibold mt-2">{product.price}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'services') && results.services.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Services</h2>
                        <div className="grid gap-4">
                          {results.services.map((service) => (
                            <Link key={service.id} href={`/freelance/services/${service.id}`}>
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{service.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{service.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <p className="text-primary-600 dark:text-primary-400 font-semibold">{service.price}</p>
                                  {service.profile && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      ⭐ {service.profile.rating} ({service.profile.totalReviews} reviews)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                  {service.profile?.profilePhotoUrl ? (
                                    <img src={service.profile.profilePhotoUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                      {service.profile?.displayName || service.user?.username}
                                    </span>
                                    {service.user?.publicId && (
                                      <span className="text-[11px] text-gray-500 dark:text-gray-400">ID: {service.user.publicId}</span>
                                    )}
                                  </div>
                                  {service.profile?.availability && (
                                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                      {service.profile.availability}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'freelancers') && results.freelancers.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Freelancers</h2>
                        <div className="grid gap-4">
                          {results.freelancers.map((freelancer) => (
                            <Link key={freelancer.id} href={`/freelance/profile/${freelancer.userId}`}>
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                  {freelancer.profilePhotoUrl ? (
                                    <img src={freelancer.profilePhotoUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                  )}
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                      {freelancer.displayName || freelancer.user.username}
                                    </h3>
                                    {freelancer.user.publicId && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {freelancer.user.publicId}</p>
                                    )}
                                    {freelancer.bio && (
                                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{freelancer.bio}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                        ⭐ {freelancer.rating} ({freelancer.totalReviews} reviews)
                                      </span>
                                      {freelancer.skills && freelancer.skills.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                          {freelancer.skills.slice(0, 3).map((skill: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-700 dark:text-gray-300">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {freelancer.availability && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 h-fit">
                                      {freelancer.availability}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'ads') && results.ads.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Ads ({results.ads.length})
                          </h2>
                        </div>
                        <div className="grid gap-4">
                          {results.ads.map((ad) => (
                            <Link key={ad.id} href={`/ads/${ad.id}`}>
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{ad.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{ad.description}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-primary-600 dark:text-primary-400 font-bold">${ad.budget}</p>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    by {ad.advertiser?.username}
                                  </span>
                                </div>
                                {ad.advertiser?.publicId && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {ad.advertiser.publicId}</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}

                    {results.total === 0 && (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No results found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          We couldn't find anything matching "{router.query.q}"
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          Try searching with different keywords or browse our categories
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

