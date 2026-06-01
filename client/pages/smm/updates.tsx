import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, CheckCircle, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const updates = [
  {
    id: 1,
    title: 'New SMM Panel Interface',
    date: '2023-12-18',
    status: 'released',
    description: 'Completely redesigned the SMM panel interface with better navigation and improved user experience.',
    features: [
      'New side panel navigation',
      'Improved service categorization',
      'Better mobile responsiveness',
      'Dark mode support'
    ]
  },
  {
    id: 2,
    title: 'Order History Page',
    date: '2023-12-18',
    status: 'released',
    description: 'Added a dedicated page to view and manage your SMM order history.',
    features: [
      'View all past orders',
      'Filter orders by status',
      'Check order details',
      'Refresh order status'
    ]
  },
  {
    id: 3,
    title: 'Upcoming: Multiple Payment Methods',
    date: 'Coming Soon',
    status: 'planned',
    description: 'We\'re adding support for multiple payment methods including credit cards, PayPal, and cryptocurrency.',
    features: []
  },
  {
    id: 4,
    title: 'Upcoming: API Access',
    date: 'Coming Soon',
    status: 'planned',
    description: 'We\'re working on a full-featured API to let you integrate our SMM services directly into your applications.',
    features: []
  }
];

export default function SMMUpdatesPage() {
  const router = useRouter();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>Updates - SMM Panel - The Bridge</title>
        </Head>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SMM Panel Updates</h1>
        </div>

        <div className="space-y-6">
          {updates.map((update) => (
            <div 
              key={update.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {update.title}
                    </h2>
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {update.status === 'released' ? (
                        <span className="inline-flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                          Released on {update.date}
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Clock className="h-4 w-4 text-yellow-500 mr-1.5" />
                          {update.date}
                        </span>
                      )}
                    </div>
                  </div>
                  {update.status === 'released' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Coming Soon
                    </span>
                  )}
                </div>

                <p className="mt-3 text-gray-600 dark:text-gray-300">
                  {update.description}
                </p>

                {update.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What's New:</h4>
                    <ul className="space-y-1">
                      {update.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Zap className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Have suggestions?</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We'd love to hear your feedback and feature requests.
          </p>
          <div className="mt-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Contact Support
            </Link>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
