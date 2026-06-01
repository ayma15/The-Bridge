import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import Layout from '../components/Layout';
import {
  Instagram, Facebook, Youtube, Twitter, Music, Linkedin, Search,
  Send, MessageCircle, Camera, Twitch, Globe, Star, Eye, Heart, Users,
  MessageSquare, Share2, Clock, Radio, ThumbsUp, Bookmark, MousePointerClick,
  TrendingUp, Download, PlayCircle, ChevronRight, ChevronDown, Server, Zap, Menu,
  RefreshCw, ClipboardList, Plus, Bell, DollarSign, ArrowRight, Link as LinkIcon
} from 'lucide-react';
interface SMMOrder {
  id: string;
  serviceName: string;
  quantity: number;
  price?: any;
  status: string;
  externalOrderId?: string | null;
  createdAt?: string;
}

export default function SocialBoostPage() {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState<string | null>(null); // 'Server 1' or 'Server 2'
  const [services, setServices] = useState<any[]>([]);
  const [hierarchical, setHierarchical] = useState<Record<string, Record<string, Record<string, any[]>>>>({});
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [expandedTypeGroups, setExpandedTypeGroups] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<any | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelPinned, setSidePanelPinned] = useState(false);
  const [orders, setOrders] = useState<SMMOrder[]>([]);
  const [ordersRefreshingId, setOrdersRefreshingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  
  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('smmFavorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }

    // Fetch wallet balance
    const fetchWalletBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/wallet/balance', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setWalletBalance(data.balance || '0.00');
          }
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem('smmFavorites', JSON.stringify(Array.from(favorites)));
    } else {
      localStorage.removeItem('smmFavorites');
    }
  }, [favorites]);

  // Toggle favorite status for a service
  const toggleFavorite = (serviceId: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(serviceId)) {
        newFavorites.delete(serviceId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(serviceId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  // Check if a service is favorited
  const isFavorite = (serviceId: string) => {
    return favorites.has(serviceId);
  };

  // Navigation items for the side panel
  const navItems = [
    {
      name: 'New Order',
      icon: <Plus size={18} className="shrink-0" />,
      href: '/smm',
      active: router.pathname === '/smm',
    },
    {
      name: 'My Orders',
      icon: <ClipboardList size={18} className="shrink-0" />,
      href: '/smm/orders',
      active: router.pathname.startsWith('/smm/orders'),
    },
    {
      name: 'Add Funds',
      icon: <DollarSign size={18} className="shrink-0" />,
      href: '/wallet/deposit', // Update this when you implement the wallet/deposit page
      active: router.pathname === '/wallet/deposit',
    },
    {
      name: 'Updates',
      icon: <Bell size={18} className="shrink-0" />,
      href: '/smm/updates', // Create this page later
      active: router.pathname === '/smm/updates',
    },
  ];

  const fetchServices = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please login to view services');
      router.push('/auth/login');
      return;
    }

    console.log('Fetching services...');
    setServicesLoading(true);
    setError(null);

    try {
      const provider = selectedServer === 'Server 1' ? 'N1PANEL' : 'JUSTANOTHERPANEL';
      console.log('Using provider:', provider);
      
      const res = await axios.get('/api/social-boost/services', {
        params: { 
          provider
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('Services API response:', {
        status: res.status,
        data: res.data ? { 
          servicesCount: Array.isArray(res.data.services) ? res.data.services.length : 'invalid',
          hasHierarchical: !!res.data.hierarchical,
          hasMainCategories: Array.isArray(res.data.mainCategories)
        } : 'no data'
      });

      const servicesData = Array.isArray(res.data?.services) ? res.data.services : [];
      const hierarchicalData = res.data?.hierarchical || {};
      const mainCategoriesData = Array.isArray(res.data?.mainCategories) ? res.data.mainCategories : [];

      console.log(`Loaded ${servicesData.length} services, ${Object.keys(hierarchicalData).length} main categories`);
      
      setServices(servicesData);
      setHierarchical(hierarchicalData);
      setMainCategories(mainCategoriesData);
      
      if (servicesData.length === 0) {
        console.warn('No services returned from API');
        toast.error('No services available. Please try again later.');
      }
    } catch (err: any) {
      console.error('Error loading SMM services:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers ? '...' : undefined
        }
      });
      
      let errorMessage = 'Failed to load services';
      
      if (err.response) {
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setServicesLoading(false);
    }
  }, [selectedServer, router]);

  useEffect(() => {
    if (!selectedServer) {
      setServices([]);
      setHierarchical({});
      setMainCategories([]);
      setServicesLoading(false);
      return;
    }

    fetchServices();
  }, [selectedServer, router, fetchServices]);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found');
      router.push('/auth/login');
      return;
    }
    
    setOrdersLoading(true);
    try {
      console.log('Fetching orders...');
      const res = await axios.get('/api/social-boost/orders', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          page: 1, 
          limit: 20,
          _t: Date.now() // Keep orders fresh without re-downloading services list
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Orders loaded successfully:', res.data);
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch (err: any) {
      console.error('Failed to load orders:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers ? '...' : undefined
        }
      });
      
      if (err.response) {
        // Server responded with an error status code
        if (err.response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          router.push('/auth/login');
          toast.error('Your session has expired. Please log in again.');
        } else if (err.response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(err.response.data?.message || 'Failed to load orders. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received from server');
        toast.error('Unable to connect to the server. Please check your connection.');
      } else {
        // Something else happened
        console.error('Error setting up request:', err.message);
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [router]);

  const refreshOrder = async (orderId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login');
      router.push('/auth/login');
      return;
    }
    setOrdersRefreshingId(orderId);
    try {
      const res = await axios.post(
        `/api/social-boost/orders/${orderId}/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data?.order;
      if (updated) {
        setOrders((prev: any[]) => prev.map((o: { id: string; }) => (o.id === orderId ? { ...o, ...updated } : o)));
      }
    } catch (err: any) {
      console.error('Failed to refresh order:', err);
      toast.error(err.response?.data?.message || 'Failed to refresh order');
    } finally {
    }
  };

  useEffect(() => {
    if (sidePanelOpen) fetchOrders();
  }, [sidePanelOpen, fetchOrders]);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('smmFavorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem('smmFavorites', JSON.stringify(Array.from(favorites)));
    } else {
      localStorage.removeItem('smmFavorites');
    }
  }, [favorites]);

  // Get favorited services
  const getFavoritedServices = () => {
    if (!services.length) return [];
    return services.filter(service => isFavorite(service.id));
  };

  // Effect to expand first category when server is selected
  useEffect(() => {
    if (selectedServer && mainCategories.length > 0) {
      if (expandedCategories.size === 0) {
        setExpandedCategories(new Set([mainCategories[0]]));
      }
    }
  }, [selectedServer, hierarchical, mainCategories]);

  // Filter services by selected server
  const getFilteredHierarchical = (): Record<string, Record<string, Record<string, any[]>>> => {
    if (!selectedServer) return {};

    const q = filter.trim().toLowerCase();
    if (!q) return hierarchical;

    const result: Record<string, Record<string, Record<string, any[]>>> = {};
    for (const [category, subcategories] of Object.entries(hierarchical)) {
      const filteredSubcats: Record<string, Record<string, any[]>> = {};
      for (const [subcategory, typeGroups] of Object.entries(subcategories)) {
        const filteredTypeGroups: Record<string, any[]> = {};
        for (const [typeGroup, serviceList] of Object.entries(typeGroups || {})) {
          const filteredServices = (serviceList || []).filter((s: any) => {
            const name = String(s?.name || '').toLowerCase();
            const desc = String(s?.description || '').toLowerCase();
            return name.includes(q) || desc.includes(q);
          });
          if (filteredServices.length > 0) filteredTypeGroups[typeGroup] = filteredServices;
        }
        if (Object.keys(filteredTypeGroups).length > 0) filteredSubcats[subcategory] = filteredTypeGroups;
      }
      if (Object.keys(filteredSubcats).length > 0) result[category] = filteredSubcats;
    }
    return result;
  };

  // Get categories for selected server
  const getFilteredCategories = (): string[] => {
    if (!selectedServer) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return mainCategories;
    const filteredHierarchical = getFilteredHierarchical();
    return mainCategories.filter((c) => {
      const subcats = filteredHierarchical[c];
      return subcats && Object.keys(subcats).length > 0;
    });
  };

  // Toggle main category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategory: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategory)) {
      newExpanded.delete(subcategory);
    } else {
      newExpanded.add(subcategory);
    }
    setExpandedSubcategories(newExpanded);
  };

  const toggleTypeGroup = (key: string) => {
    const newExpanded = new Set(expandedTypeGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTypeGroups(newExpanded);
  };

  // Filter services
  const filterServices = (serviceList: any[]) => {
    if (!filter) return serviceList;
    return serviceList.filter(
      s => s.name.toLowerCase().includes(filter.toLowerCase()) ||
           (s.description && s.description.toLowerCase().includes(filter.toLowerCase()))
    );
  };

  // Get category icon component (latest brand logos - line style)
  const getCategoryIcon = (category: string, size: number = 32) => {
    const iconProps = { size, className: 'stroke-current' };
    const TikTokIcon = ({ size, className }: { size: number; className?: string }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M14 3v10.2a4.8 4.8 0 1 1-3.2-4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3c1.6 2.2 3.6 3.5 6 3.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
    const iconMap: Record<string, JSX.Element> = {
      'Instagram': <Instagram {...iconProps} />, // Latest Instagram icon
      'Facebook': <Facebook {...iconProps} />, // Latest Facebook icon
      'YouTube': <Youtube {...iconProps} />, // Latest YouTube icon
      'X': <Twitter {...iconProps} />, // X/Twitter icon
      'Spotify': <Music {...iconProps} />, // Spotify music icon
      'TikTok': <TikTokIcon {...iconProps} />,
      'LinkedIn': <Linkedin {...iconProps} />, // Latest LinkedIn icon
      'Google': <Search {...iconProps} />, // Google search icon
      'Telegram': <Send {...iconProps} />, // Telegram send icon
      'Discord': <MessageCircle {...iconProps} />, // Discord message icon
      'Snapchat': <Camera {...iconProps} />, // Snapchat camera icon
      'Twitch': <Twitch {...iconProps} />, // Latest Twitch icon
      'Website Traffic': <Globe {...iconProps} />, // Globe icon
      'Reviews': <Star {...iconProps} /> // Star icon
    };
    return iconMap[category] || <Star {...iconProps} />;
  };
  
  // Get subcategory icon component (descriptive line-style icons)
  const getSubcategoryIcon = (subcategory: string, size: number = 20) => {
    const iconProps = { size, className: 'stroke-current' };
    const subcategoryLower = subcategory.toLowerCase();
    
    if (subcategoryLower.includes('view')) return <Eye {...iconProps} />;
    if (subcategoryLower.includes('like')) return <Heart {...iconProps} />;
    if (subcategoryLower.includes('follower') || subcategoryLower.includes('subscriber')) return <Users {...iconProps} />;
    if (subcategoryLower.includes('comment')) return <MessageSquare {...iconProps} />;
    if (subcategoryLower.includes('share') || subcategoryLower.includes('retweet') || subcategoryLower.includes('repost')) return <Share2 {...iconProps} />;
    if (subcategoryLower.includes('watchtime') || subcategoryLower.includes('watch time') || subcategoryLower.includes('hour')) return <Clock {...iconProps} />;
    if (subcategoryLower.includes('live') || subcategoryLower.includes('stream')) return <Radio {...iconProps} />;
    if (subcategoryLower.includes('reaction')) return <ThumbsUp {...iconProps} />;
    if (subcategoryLower.includes('save') || subcategoryLower.includes('bookmark')) return <Bookmark {...iconProps} />;
    if (subcategoryLower.includes('impression') || subcategoryLower.includes('reach')) return <TrendingUp {...iconProps} />;
    if (subcategoryLower.includes('click') || subcategoryLower.includes('visit')) return <MousePointerClick {...iconProps} />;
    if (subcategoryLower.includes('play') || subcategoryLower.includes('listen')) return <PlayCircle {...iconProps} />;
    if (subcategoryLower.includes('download')) return <Download {...iconProps} />;
    if (subcategoryLower.includes('engagement')) return <TrendingUp {...iconProps} />;
    
    // Default icon for services
    return <Star {...iconProps} />;
  };
  
  // Get category color gradient (for beautiful dashboard theme)
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Instagram': 'from-pink-500 to-purple-600',
      'Facebook': 'from-blue-500 to-blue-700',
      'YouTube': 'from-red-500 to-red-700',
      'X': 'from-gray-800 to-black',
      'Spotify': 'from-green-500 to-green-700',
      'TikTok': 'from-cyan-500 to-pink-600',
      'LinkedIn': 'from-blue-600 to-blue-800',
      'Google': 'from-blue-500 to-red-500',
      'Telegram': 'from-blue-400 to-blue-600',
      'Discord': 'from-indigo-500 to-indigo-700',
      'Snapchat': 'from-yellow-400 to-yellow-600',
      'Twitch': 'from-purple-500 to-purple-700',
      'Website Traffic': 'from-indigo-500 to-purple-600',
      'Reviews': 'from-yellow-400 to-orange-500'
    };
    return colorMap[category] || 'from-gray-500 to-gray-700';
  };

  // Toggle side panel
  const toggleSidePanel = () => {
    setSidePanelOpen(!sidePanelOpen);
  };

  // Toggle pin state of side panel
  const togglePinSidePanel = () => {
    setSidePanelPinned(!sidePanelPinned);
    // If pinning and panel is closed, open it
    if (!sidePanelPinned && !sidePanelOpen) {
      setSidePanelOpen(true);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>Social Boost - The Bridge</title>
        </Head>
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Social Boost Services
            </h1>
            <button
              type="button"
              onClick={() => {
                const next = !sidePanelOpen;
                setSidePanelOpen(next);
                setSidePanelPinned(next);
              }}
              onMouseEnter={() => {
                if (!sidePanelPinned) setSidePanelOpen(true);
              }}
              onMouseLeave={() => {
                if (!sidePanelPinned) setSidePanelOpen(false);
              }}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open side panel"
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        
        {/* Server Selection - First Step */}
        {!selectedServer && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Select Server
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose a server to browse available services
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => {
                  setSelectedServer('Server 1');
                  setExpandedCategories(new Set());
                  setExpandedSubcategories(new Set());
                  setExpandedTypeGroups(new Set());
                }}
                className="group relative p-6 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:scale-[1.02] hover-lift"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <Server size={32} className="stroke-current" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Server 1
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse services
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedServer('Server 2');
                  setExpandedCategories(new Set());
                  setExpandedSubcategories(new Set());
                  setExpandedTypeGroups(new Set());
                }}
                className="group relative p-6 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-xl hover:scale-[1.02] hover-lift"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <Zap size={32} className="stroke-current" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Server 2
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse services
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {selectedServer && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedServer(null);
                  setExpandedCategories(new Set());
                  setExpandedSubcategories(new Set());
                  setExpandedTypeGroups(new Set());
                  setFilter('');
                }}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={20} className="rotate-180 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedServer}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Browse services
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        {selectedServer && (
          <div className="mb-4">
            <input
              className="w-full max-w-md p-2.5 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search services..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {servicesLoading ? (
          <div className="text-gray-600 dark:text-gray-400 mt-8 text-center">Loading services...</div>
        ) : selectedServer ? (
          <>
            {/* Category Grid Selection - Ultra Compact (Half Size) */}
            <div className="mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-1.5">
                {getFilteredCategories().map(category => {
                  const filteredHierarchical = getFilteredHierarchical();
                  const subcategories = filteredHierarchical[category] || {};
                  const subcategoryKeys = Object.keys(subcategories);
                  const totalServices = subcategoryKeys.reduce((sum, subcat) => {
                    const typeGroups = subcategories[subcat] || {};
                    return sum + Object.values(typeGroups).reduce((acc: number, list: any) => acc + ((list as any[])?.length || 0), 0);
                  }, 0);
                  const isSelected = expandedCategories.has(category);
                  const categoryColor = getCategoryColor(category);
                  
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`relative p-1.5 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5 min-h-[45px] group overflow-hidden ${
                        isSelected
                          ? `bg-gradient-to-br ${categoryColor} shadow-md shadow-black/10 scale-[1.01] ring-1 ring-white/20`
                          : 'bg-white dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/90 hover:shadow-sm hover:scale-[1.005] border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {/* Background glow effect for selected */}
                      {isSelected && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-10 blur-md`}></div>
                      )}
                      
                      <div className={`relative z-10 transition-all duration-200 ${
                        isSelected 
                          ? 'scale-105' 
                          : 'group-hover:scale-105'
                      }`}>
                        <div className={isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
                          {getCategoryIcon(category, 20)}
                        </div>
                      </div>
                      
                      <div className="relative z-10 text-center">
                        <div className={`font-medium text-[10px] leading-tight ${
                          isSelected 
                            ? 'text-white drop-shadow-sm' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {category}
                        </div>
                        {!isSelected && totalServices > 0 && (
                          <div className="text-[8px] mt-0 text-gray-500 dark:text-gray-400">
                            {totalServices}
                          </div>
                        )}
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                      )}
                      
                      {/* Hover effect overlay */}
                      {!isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100/30 dark:to-gray-700/15 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services Display for Selected Categories */}
            {expandedCategories.size > 0 && (
              <div className="space-y-4">
                {Array.from(expandedCategories)
                  .filter((mainCategory) => {
                    const filteredHierarchical = getFilteredHierarchical();
                    const subcategories = filteredHierarchical[mainCategory] || {};
                    return Object.keys(subcategories).length > 0;
                  })
                  .map(mainCategory => {
                  const filteredHierarchical = getFilteredHierarchical();
                  const subcategories = filteredHierarchical[mainCategory] || {};
                  const subcategoryKeys = Object.keys(subcategories);
                  
                  return (
                    <div 
                      key={mainCategory}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                    >
                      {/* Main Category Header - Ultra Compact */}
                      <div className={`px-3 py-2 bg-gradient-to-r ${getCategoryColor(mainCategory)} border-b border-white/10`}>
                        <div className="flex items-center gap-2">
                          <div className="text-white drop-shadow-sm">
                            {getCategoryIcon(mainCategory, 18)}
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-white drop-shadow-sm">
                              {mainCategory}
                            </h2>
                            <p className="text-[10px] text-white/90">
                              {subcategoryKeys.length} subcategories
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subcategories */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {subcategoryKeys.map(subcategory => {
                          const typeGroups = subcategories[subcategory] || {};
                          const typeGroupKeys = Object.keys(typeGroups);
                          const totalInSubcategory = typeGroupKeys.reduce((sum, g) => sum + ((typeGroups[g] || []) as any[]).length, 0);
                          const totalInSubcategoryFiltered = typeGroupKeys.reduce((sum, g) => sum + (filterServices((typeGroups[g] || []) as any[]).length), 0);
                          if (filter.trim() && totalInSubcategoryFiltered === 0) return null;
                          const isSubExpanded = expandedSubcategories.has(subcategory);
                          const visibleTypeGroupKeys = typeGroupKeys.filter((g) => {
                            if (!filter.trim()) return true;
                            return filterServices(((typeGroups[g] || []) as any[])).length > 0;
                          });
                          
                          return (
                            <div key={subcategory}>
                              {/* Subcategory Header - Ultra Compact */}
                              <button
                                onClick={() => toggleSubcategory(subcategory)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {getSubcategoryIcon(subcategory, 16)}
                                  </div>
                                  <div className="text-left">
                                    <span className="font-medium text-xs text-gray-800 dark:text-gray-200">
                                      {subcategory}
                                    </span>
                                    <span className="ml-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                      ({filter.trim() ? totalInSubcategoryFiltered : totalInSubcategory})
                                    </span>
                                  </div>
                                </div>
                                <div className="text-gray-400">
                                  {isSubExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                              </button>
                              
                              {isSubExpanded && (
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30">
                                  {visibleTypeGroupKeys.length === 0 ? (
                                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-xs">
                                      {filter ? 'No services found matching your search.' : 'No services available.'}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {visibleTypeGroupKeys.map((typeGroup) => {
                                        const key = `${subcategory}::${typeGroup}`;
                                        const servicesList = (typeGroups[typeGroup] || []) as any[];
                                        const filteredServices = filterServices(servicesList);
                                        const isTypeExpanded = expandedTypeGroups.has(key);

                                        return (
                                          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <button
                                              onClick={() => toggleTypeGroup(key)}
                                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className="text-gray-600 dark:text-gray-400">
                                                  {getSubcategoryIcon(typeGroup, 16)}
                                                </div>
                                                <div className="text-left">
                                                  <span className="font-medium text-xs text-gray-800 dark:text-gray-200">
                                                    {typeGroup}
                                                  </span>
                                                  <span className="ml-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                    ({filter.trim() ? filteredServices.length : servicesList.length})
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="text-gray-400">
                                                {isTypeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                              </div>
                                            </button>

                                            {isTypeExpanded && (
                                              <div className="px-3 py-3 bg-gray-50 dark:bg-gray-900/30">
                                                {filteredServices.length === 0 ? (
                                                  <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-xs">
                                                    {filter ? 'No services found matching your search.' : 'No services available.'}
                                                  </div>
                                                ) : (
                                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                    {filteredServices.map((s: any) => {
                                                      // Format estimated time
                                                      const formatTime = (time: any) => {
                                                        if (!time) return null;
                                                        if (typeof time === 'number') {
                                                          if (time < 60) return `${time}m`;
                                                          if (time < 1440) return `${Math.floor(time / 60)}h`;
                                                          return `${Math.floor(time / 1440)}d`;
                                                        }
                                                        return time;
                                                      };

                                                      const avgTime = formatTime(s.averageTime || s.average_time || s.avg_time);
                                                      const minTime = formatTime(s.minTime || s.min_time || s.mintime);
                                                      const maxTime = formatTime(s.maxTime || s.max_time || s.maxtime);

                                                      return (
                                                        <div
                                                          id={`service-${s.id}`}
                                                          key={s.id}
                                                          className="relative bg-white dark:bg-gray-800 rounded-md p-2 shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col gap-1 hover:shadow-sm transition-all hover:border-primary-300 dark:hover:border-primary-600 text-sm"
                                                        >
                                                          {/* Favorite Button */}
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              toggleFavorite(s.id);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            title={isFavorite(s.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                          >
                                                            <Star 
                                                              size={16} 
                                                              className={`transition-all ${isFavorite(s.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                                                            />
                                                          </button>
                                                          <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                              {s.name}
                                                            </div>
                                                            {s.description && (
                                                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                                                                {s.description}
                                                              </div>
                                                            )}
                                                            {(avgTime || minTime || maxTime) && (
                                                              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                                                <Clock size={12} className="stroke-current" />
                                                                <span>
                                                                  {avgTime && `Avg: ${avgTime}`}
                                                                  {minTime && maxTime && ` (${minTime}-${maxTime})`}
                                                                  {minTime && !maxTime && !avgTime && `Min: ${minTime}`}
                                                                  {maxTime && !minTime && !avgTime && `Max: ${maxTime}`}
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>

                                                          <div className="flex flex-col gap-1.5 mt-auto">
                                                            <div className="flex items-center justify-between p-1.5 text-sm text-[10px] text-gray-500 dark:text-gray-400">
                                                              <span>Min: {s.min?.toLocaleString() || s.minOrder?.toLocaleString() || 'N/A'}</span>
                                                              <span>Max: {s.max?.toLocaleString() || s.maxOrder?.toLocaleString() || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                              {s.refill && (
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                                                  Refill
                                                                </span>
                                                              )}
                                                              {s.dripfeed && (
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                                  Dripfeed
                                                                </span>
                                                              )}
                                                              {s.cancel && (
                                                                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                                                                  Cancel
                                                                </span>
                                                              )}
                                                            </div>
                                                            <div className="font-bold text-sm text-primary-600 dark:text-primary-400">
                                                              {Number(s.rate).toFixed(2)} $ / 1k
                                                            </div>
                                                            <button
                                                              className="mt-0.5 px-2.5 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium text-xs"
                                                              onClick={() => setModal(s)}
                                                            >
                                                              Order Now
                                                            </button>
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {/* Order Modal */}
        {modal && (
          <OrderModal
            service={modal}
            onClose={() => setModal(null)}
            onOrdered={() => {
              setModal(null);
              toast.success('Order placed successfully!');
            }}
          />
        )}
      </div>

      {/* Right Slide-out Side Panel */}
      <div
        className={`side-panel fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-200 z-40 ${
          sidePanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onMouseEnter={() => {
          if (!sidePanelPinned) setSidePanelOpen(true);
        }}
        onMouseLeave={() => {
          if (!sidePanelPinned) setSidePanelOpen(false);
        }}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Panel</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {sidePanelPinned ? 'Pinned' : 'Hover preview'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidePanelOpen(false);
              setSidePanelPinned(false);
            }}
            className="px-2 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Navigation Links */}
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Server Selection */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Server Selection
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedServer('Server 1')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedServer === 'Server 1'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <Server size={16} className="shrink-0" />
                <span>Server 1</span>
              </button>
              <button
                onClick={() => setSelectedServer('Server 2')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${
                  selectedServer === 'Server 2'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <Server size={16} className="shrink-0" />
                <span>Server 2</span>
              </button>
            </div>
          </div>

          {/* Favorites Section */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Favorites
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {getFavoritedServices().length > 0 ? (
                getFavoritedServices().map(service => {
                  // Find the first occurrence of the service in the hierarchical data
                  let scrollToId = '';
                  Object.entries(hierarchical).forEach(([category, subcategories]) => {
                    Object.entries(subcategories).forEach(([subcategory, typeGroups]) => {
                      Object.entries(typeGroups).forEach(([typeGroup, servicesList]) => {
                        const foundService = (servicesList as any[]).find(s => s.id === service.id);
                        if (foundService) {
                          scrollToId = `service-${service.id}`;
                        }
                      });
                    });
                  });

                  return (
                    <div 
                      key={`fav-${service.id}`}
                      className="group flex items-center justify-between p-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                      onClick={() => {
                        // Set the service as the modal to show the order form
                        setModal(service);
                        // Close the side panel if not pinned
                        if (!sidePanelPinned) {
                          setSidePanelOpen(false);
                        }
                      }}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                        {service.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(service.id);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                        title="Remove from favorites"
                      >
                        <Star size={16} className="fill-current" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  No favorites yet. Click the star on a service to add it here.
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="px-2.5 py-1.5 text-sm bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Available Balance</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(walletBalance).toFixed(2)}
                </div>
                <button className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}

interface ServiceType {
  provider: any;
  id: string | number;
  service?: string | number;
  name: string;
  category: string;
  description?: string;
  min: number;
  max: number;
  rate?: number;
  increment?: number;
  averageTime?: any;
  avg_time?: any;
  average_time?: any;
  minTime?: any;
  maxTime?: any;
  min_time?: any;
  max_time?: any;
}

interface OrderModalProps {
  service: ServiceType;
  onClose: () => void;
  onOrdered: () => void;
}

function OrderModal({ service, onClose, onOrdered }: OrderModalProps) {
  const [quantity, setQuantity] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatTime = (time: any) => {
    if (!time) return null;
    if (typeof time === 'number') {
      if (time < 60) return `${time}m`;
      if (time < 1440) return `${Math.floor(time / 60)}h`;
      return `${Math.floor(time / 1440)}d`;
    }
    return String(time);
  };

  const qty = parseInt(quantity);
  const increment = Number(service.increment || 1);
  const qtyInRange = quantity !== '' && !isNaN(qty) && qty >= service.min && qty <= service.max;
  const qtyDivisible = qtyInRange && (increment <= 1 || qty % increment === 0);
  const qtyValid = qtyInRange && qtyDivisible;
  const rateUsdPer1k = Number(service.rate || 0);
  const totalUsd = qtyValid ? Math.ceil(rateUsdPer1k * (qty / 1000) * 100) / 100 : null;
  const avgTime = formatTime(service.averageTime || service.average_time || service.avg_time);

  const qtyWarning = (() => {
    if (quantity === '') return null;
    if (isNaN(qty)) return 'Please enter a valid number.';
    if (qty < service.min) return `Quantity is below the minimum (${service.min.toLocaleString()}).`;
    if (qty > service.max) return `Quantity is above the maximum (${service.max.toLocaleString()}).`;
    if (increment > 1 && qty % increment !== 0) return `Quantity must be divisible by ${increment}.`;
    return null;
  })();

  const handleOrder = async () => {
    // Validate quantity
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty < service.min || qty > service.max) {
      toast.error(`Please enter a valid quantity between ${service.min} and ${service.max}`);
      return;
    }

    const increment = Number(service.increment || 1);
    if (increment > 1 && qty % increment !== 0) {
      toast.error(`Quantity must be divisible by ${increment}`);
      return;
    }

    if (!link || link.trim() === '') {
      toast.error('Please enter a valid link');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to place an order');
      router.push('/auth/login');
      onClose();
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/social-boost/orders', {
        serviceId: service.service || service.id,
        serviceName: service.name,
        provider: service.provider,
        quantity: qty,
        link: link.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data.success) onOrdered();
      else toast.error(res.data.message || res.data.error || 'Failed to place order');
    } catch (e: any) {
      if (e.response?.status === 401) {
        toast.error('Please login to place an order');
        router.push('/auth/login');
        onClose();
      } else {
        const serverMessage = e.response?.data?.message;
        const firstValidationMsg = Array.isArray(e.response?.data?.errors)
          ? e.response.data.errors?.[0]?.msg
          : undefined;
        toast.error(serverMessage || firstValidationMsg || e.response?.data?.error || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full shadow-xl p-8 relative">
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl font-bold" 
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Order: {service.name}</h2>
        <div className="mb-3 text-gray-600 dark:text-gray-400 text-sm">{service.category}</div>
        {service.description && (
          <div className="mb-4 text-gray-500 dark:text-gray-300 text-sm">{service.description}</div>
        )}

        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Rate</span>
            <span className="font-semibold">{rateUsdPer1k ? `$${rateUsdPer1k.toFixed(2)} / 1k` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mt-1">
            <span>Total</span>
            <span className="font-semibold">{totalUsd !== null ? `$${totalUsd.toFixed(2)}` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mt-1">
            <span>Average time</span>
            <span className="font-semibold">{avgTime || 'N/A'}</span>
          </div>
        </div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Quantity ({service.min.toLocaleString()} - {service.max.toLocaleString()}):
        </label>
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder={`Enter quantity (${service.min} - ${service.max})`}
          className="w-full mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {qtyWarning && (
          <div className="-mt-3 mb-4 text-xs text-orange-600 dark:text-orange-400">
            {qtyWarning}
          </div>
        )}
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Link:
        </label>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          className="w-full mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Paste your target link here"
        />
        <button
          onClick={handleOrder}
          disabled={loading || !link.trim() || !qtyValid}
          className="w-full py-3 mt-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Ordering...' : 'Order Now'}
        </button>
      </div>
    </div>
  );
}


