import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ShoppingCart, Store, ArrowRight } from 'lucide-react'
import UserProfileMenu from '../components/UserProfileMenu'
import SearchBar from '../components/SearchBar'

export default function ShopLandingPage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<'buyer' | 'seller' | null>(null)

  const handleContinue = () => {
    if (selectedOption === 'buyer') {
      router.push('/products')
    } else if (selectedOption === 'seller') {
      router.push('/seller')
    }
  }

  return (
    <>
      <Head>
        <title>Shop - The Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                The Bridge
              </Link>
              <div className="hidden md:block flex-1 max-w-lg mx-8">
                <SearchBar 
                  placeholder="Search products, services..." 
                  className="w-full"
                />
              </div>
              <UserProfileMenu variant="profile" />
            </div>
            {/* Mobile Search */}
            <div className="md:hidden mt-4">
              <SearchBar 
                placeholder="Search products, services..." 
                className="w-full"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Shop
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Choose how you'd like to use our marketplace
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Buyer Option */}
              <button
                onClick={() => setSelectedOption('buyer')}
                className={`p-8 rounded-lg border-2 transition-all text-left ${
                  selectedOption === 'buyer'
                    ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                       <div className={`p-4 rounded-lg transition-all duration-300 hover:scale-110 ${
                         selectedOption === 'buyer'
                           ? 'bg-primary-600 dark:bg-primary-500'
                           : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                       }`}>
                         <ShoppingCart className={`w-8 h-8 transition-all duration-300 ${
                           selectedOption === 'buyer' ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                         }`} />
                       </div>
                       <div className="flex-1">
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-105">
                           Continue as a Buyer
                         </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Browse and purchase products from sellers. Find great deals on new and used items from verified sellers in our marketplace.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        Browse thousands of products
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        Filter by category, price, and condition
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        Secure transactions with buyer protection
                      </li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Seller Option */}
              <button
                onClick={() => setSelectedOption('seller')}
                className={`p-8 rounded-lg border-2 transition-all text-left ${
                  selectedOption === 'seller'
                    ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                         <div className={`p-4 rounded-lg transition-all duration-300 hover:scale-110 ${
                           selectedOption === 'seller'
                             ? 'bg-primary-600 dark:bg-primary-500'
                             : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                         }`}>
                           <Store className={`w-8 h-8 transition-all duration-300 ${
                             selectedOption === 'seller' ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                           }`} />
                         </div>
                         <div className="flex-1">
                           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-105">
                             Continue as a Seller
                           </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      List your products and reach thousands of buyers. Set your own prices, manage inventory, and grow your business.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        List unlimited products
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        Set your own prices and terms
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                        Manage orders and track sales
                      </li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <button
                onClick={handleContinue}
                disabled={!selectedOption}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition ${
                  selectedOption
                    ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

