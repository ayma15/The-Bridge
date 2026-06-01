import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
 
import { ArrowRight, ShoppingCart, Briefcase, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import SearchBar from '../components/SearchBar'
import AIAssistantButton from '../components/AIAssistantButton'

const features = [
  {
    icon: <ShoppingCart className="w-8 h-8 icon-draw icon-animate-once icon-animate-hover" />,
    title: "Shop",
    description: "Buy and sell products with ease",
    link: "/shop",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: <Briefcase className="w-8 h-8 icon-draw icon-animate-once icon-animate-hover" />,
    title: "Jobs",
    description: "Find professionals and opportunities",
    link: "/freelance",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: <TrendingUp className="w-8 h-8 icon-draw icon-animate-once icon-animate-hover" />,
    title: "Social Boost",
    description: "Enhance your social presence",
    link: "/smm",
    color: "from-pink-500 to-pink-600"
  }
]

function HomeContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { isDark, colorScheme } = useTheme()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <>
      <Head>
        <title>The Bridge - Your Gateway to Digital Services</title>
        <meta name="description" content="Multi-service platform for all your digital needs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors duration-300`}>
        {/* Hero Section */}
        <div className={`relative overflow-hidden bg-bridge-hero ${isDark ? 'dark' : ''}`}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-theme-primary-soft blur-3xl opacity-70" />
            <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-theme-primary-soft blur-3xl opacity-50" />
            <div className={`absolute inset-0 ${isDark ? 'bg-black/35' : 'bg-white/20'}`} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
            <div className="text-center">
              <h1 
                className="text-5xl md:text-6xl font-bold mb-6 bridge-title"
              >
                <span className="gradient-text">Welcome to The Bridge</span>
              </h1>
              
              <p 
                className={`text-xl max-w-3xl mx-auto mb-10 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
              >
                Your all-in-one platform for social media services.
              </p>

              <div 
                className={`max-w-2xl mx-auto mb-12 glass rounded-2xl p-3 shadow-theme-primary-soft border ${isDark ? 'border-white/10' : 'border-black/5'}`}
              >
                <SearchBar 
                  placeholder="Search services, products, jobs..." 
                  className="shadow-lg"
                />
              </div>

              <div 
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold bg-theme-primary text-white shadow-theme-primary-soft hover:opacity-95 hover-lift"
                  >
                    Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/auth/register" 
                      className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold bg-theme-primary text-white shadow-theme-primary-soft hover:opacity-95 hover-lift"
                    >
                      Get Started
                    </Link>
                    <Link 
                      href="/auth/login" 
                      className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold hover-lift glass ${isDark ? 'text-white border-white/10' : 'text-gray-900 border-black/10'}`}
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Everything You Need in One Place</h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Discover our comprehensive suite of services designed to empower your digital journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group"
              >
                <Link href={feature.link} className="block h-full">
                  <div className={`h-full rounded-2xl p-6 border hover-lift ${isDark ? 'bg-gray-900/60 border-white/10' : 'bg-white border-gray-100'} shadow-theme-primary-soft`}>
                    <div className={`w-16 h-16 rounded-xl bg-theme-primary flex items-center justify-center text-white mb-6 animate-bridge-float`}>
                      {feature.icon}
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{feature.description}</p>
                    <div className={`mt-4 flex items-center theme-primary group-hover:translate-x-1 transition-transform duration-300`}>
                      <span>Learn more</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-theme-primary text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              Ready to Get Started?
            </h2>
            <p 
              className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto"
            >
              Join thousands of users who are already growing their business with The Bridge.
            </p>
            <div>
              <Link 
                href={isAuthenticated ? "/dashboard" : "/auth/register"} 
                className="inline-block bg-white/95 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
              </Link>
            </div>
          </div>
        </div>
        <AIAssistantButton />
      </main>
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a simple loading state or null while mounting
    return null
  }

  return <HomeContent />
}


