import { ReactNode } from 'react'
import Link from 'next/link'
import SearchBar from './SearchBar'
import AIAssistantButton from './AIAssistantButton'
import UserProfileMenu from './UserProfileMenu'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
             <Link href="/" className="bridge-title text-2xl font-bold text-gray-900 dark:text-white">
               <span className="theme-primary">The</span> Bridge
             </Link>
            
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            <nav className="flex items-center gap-4">
               <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105">
                 Home
               </Link>
               <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105">
                 Dashboard
               </Link>
               <UserProfileMenu />
             </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* AI Assistant Button */}
      <AIAssistantButton />
    </div>
  )
}

