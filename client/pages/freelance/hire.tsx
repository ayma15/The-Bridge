import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Filter, User, Star, Briefcase, MapPin, DollarSign, Clock } from 'lucide-react'

interface Freelancer {
  id: string
  name: string
  title: string
  description: string
  hourlyRate: string
  location: string
  skills: string[]
  rating: number
  completedJobs: number
  earnings: string
  verified: boolean
}

export default function FreelanceHirePage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('all')

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setFreelancers([
        {
          id: '1',
          name: 'John Doe',
          title: 'Full-Stack Developer',
          description: 'Experienced developer specializing in React, Node.js, and cloud architecture.',
          hourlyRate: '$75/hr',
          location: 'United States',
          skills: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
          rating: 4.9,
          completedJobs: 47,
          earnings: '$125,000+',
          verified: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          title: 'UI/UX Designer',
          description: 'Creative designer with 8+ years of experience in mobile and web design.',
          hourlyRate: '$60/hr',
          location: 'United Kingdom',
          skills: ['Figma', 'Adobe XD', 'Mobile Design', 'Prototyping'],
          rating: 4.8,
          completedJobs: 62,
          earnings: '$98,000+',
          verified: true
        },
        {
          id: '3',
          name: 'Mike Johnson',
          title: 'Content Writer',
          description: 'Professional writer specializing in tech blogs and marketing content.',
          hourlyRate: '$45/hr',
          location: 'Canada',
          skills: ['Content Writing', 'SEO', 'Technical Writing', 'Marketing'],
          rating: 4.7,
          completedJobs: 31,
          earnings: '$42,000+',
          verified: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         freelancer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         freelancer.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSkill = selectedSkill === 'all' || freelancer.skills.some(skill => 
      skill.toLowerCase().includes(selectedSkill.toLowerCase())
    )
    return matchesSearch && matchesSkill
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <>
      <Head>
        <title>Hire Talent - The Bridge</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/freelance"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              ← Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hire Freelancers
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Find talented professionals for your projects
            </p>
          </div>

          {/* Post a Job CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Have a project in mind?</h2>
                <p className="mb-4">Post a job and let freelancers come to you</p>
              </div>
              <Link
                href="/freelance/post"
                className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Post a Job
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search freelancers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Skills</option>
                  <option value="react">React</option>
                  <option value="node">Node.js</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="marketing">Marketing</option>
                </select>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Freelancers List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading freelancers...</p>
              </div>
            ) : filteredFreelancers.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No freelancers found matching your criteria.</p>
              </div>
            ) : (
              filteredFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Profile Section */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {freelancer.name}
                            </h3>
                            {freelancer.verified && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{freelancer.title}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {freelancer.hourlyRate}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            {renderStars(freelancer.rating)}
                            <span className="ml-1">{freelancer.rating}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {freelancer.description}
                      </p>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {freelancer.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {freelancer.completedJobs} jobs
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {freelancer.earnings}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {freelancer.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href={`/freelance/profile/${freelancer.id}`}
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/chat?user=${freelancer.id}`}
                          className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
