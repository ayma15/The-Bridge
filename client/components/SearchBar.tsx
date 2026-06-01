import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Search, X } from 'lucide-react'
import axios from 'axios'

interface SearchSuggestion {
  text: string
  type: 'product' | 'service' | 'category' | 'user' | 'ad'
  id?: string
  url?: string
}

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ onSearch, placeholder = 'Search products, services, jobs...', className = '' }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 2) {
      timeoutRef.current = window.setTimeout(async () => {
        try {
          const response = await axios.get('/api/search/suggestions', {
            params: { q: query }
          })
          setSuggestions(response.data.suggestions || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Search suggestions error:', error)
          // Silently fail - suggestions are optional
          setSuggestions([])
          setShowSuggestions(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  const findExactMatch = async (query: string) => {
    try {
      // Try to find an exact match
      const response = await axios.get('/api/search', {
        params: { 
          q: query,
          exact: 'true',
          limit: 1
        }
      });

      // Check for exact matches in each category
      if (response.data.products?.length > 0) {
        return `/products/${response.data.products[0].id}`;
      }
      if (response.data.services?.length > 0) {
        return `/services/${response.data.services[0].id}`;
      }
      if (response.data.users?.length > 0) {
        return `/profile/${response.data.users[0].id}`;
      }
      if (response.data.ads?.length > 0) {
        return `/ads/${response.data.ads[0].id}`;
      }
      return null;
    } catch (error) {
      console.error('Exact match search error:', error);
      return null;
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    try {
      // First try to find an exact match
      const directUrl = await findExactMatch(trimmedQuery);
      
      if (directUrl) {
        // Navigate directly to the item
        router.push(directUrl);
      } else if (onSearch) {
        // Use custom search handler if provided
        onSearch(trimmedQuery);
      } else {
        // Fall back to search results page
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to regular search on error
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } finally {
      setShowSuggestions(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = async (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    
    // If suggestion has a direct URL, use it
    if (suggestion.url) {
      router.push(suggestion.url);
      setShowSuggestions(false);
      return;
    }
    
    // Otherwise, perform a search
    await handleSearch(suggestion.text);
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setShowSuggestions(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="flex-1">{suggestion.text}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{suggestion.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

