import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import { RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface SMMOrder {
  id: string;
  serviceName: string;
  provider: string;
  quantity: number;
  price?: any;
  status: string;
  externalOrderId?: string | null;
  createdAt: string;
  link?: string;
}

export default function SMMOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SMMOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axios.get('/api/social-boost/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 100 }
      });
      setOrders(res.data?.orders || []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const refreshOrder = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login');
      router.push('/auth/login');
      return;
    }
    
    setRefreshingId(orderId);
    try {
      const res = await axios.post(
        `/api/social-boost/orders/${orderId}/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data?.order;
      if (updated) {
        setOrders(prev => 
          prev.map(o => (o.id === orderId ? { ...o, ...updated } : o))
        );
        toast.success('Order status updated');
      }
    } catch (err: any) {
      console.error('Failed to refresh order:', err);
      toast.error(err.response?.data?.message || 'Failed to refresh order');
    } finally {
      setRefreshingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (s === 'COMPLETED') return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Completed</span>;
    if (s === 'IN_PROGRESS' || s === 'PROCESSING') return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>In Progress</span>;
    if (s === 'PENDING' || s === 'PENDING_PAYMENT') return <span className={`${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>Pending</span>;
    if (s === 'FAILED' || s === 'ERROR') return <span className={`${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Failed</span>;
    if (s === 'CANCELLED') return <span className={`${base} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>Cancelled</span>;
    return <span className={`${base} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>{s.replace(/_/g, ' ')}</span>;
  };

  // Format date with real-time updates
  const formatDate = (dateString: string) => {
    const [date, time] = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).split(',');
    
    return `${date.trim()}, ${time.trim()}`;
  };

  // Update the time every second
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>My Orders - SMM Panel - The Bridge</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My SMM Orders</h1>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="mt-2">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
              <div className="mt-4">
                <Link 
                  href="/smm"
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  Start a new order
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.provider}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Qty: {order.quantity}
                        </div>
                        {order.externalOrderId && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {order.externalOrderId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="whitespace-nowrap">
                          <div>{formatDate(order.createdAt)}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {currentTime.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => refreshOrder(order.id)}
                            disabled={refreshingId === order.id}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh status"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshingId === order.id ? 'animate-spin' : ''}`} />
                          </button>
                          {order.link && (
                            <a
                              href={order.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="View on provider"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
