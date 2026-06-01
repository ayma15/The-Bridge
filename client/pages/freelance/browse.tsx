import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Filter, Briefcase, Clock, DollarSign, MapPin, Building } from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  budget: string
  duration: string
  location: string
  skills: string[]
  postedBy: string
  postedAt: string
  status: string
}

export default function FreelanceBrowsePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock data for now
  useEffect(() => {
    setTimeout(() => {
      setJobs([
        {
          id: '1',
          title: 'Full-Stack Web Developer',
          description: 'Looking for an experienced full-stack developer to build a modern e-commerce platform.',
          budget: '$5,000 - $8,000',
          duration: '2-3 months',
          location: 'Remote',
          skills: ['React', 'Node.js', 'PostgreSQL'],
          postedBy: 'Tech Startup Inc.',
          postedAt: '2 days ago',
          status: 'open'
        },
        {
          id: '2',
          title: 'UI/UX Designer',
          description: 'Need a creative designer to redesign our mobile app interface.',
          budget: '$2,000 - $3,500',
          duration: '1 month',
          location: 'Remote',
          skills: ['Figma', 'Adobe XD', 'Mobile Design'],
          postedBy: 'App Company',
          postedAt: '1 week ago',
          status: 'open'
        },
        {
          id: '3',
          title: 'Content Writer',
          description: 'Seeking a skilled content writer for blog posts and marketing materials.',
          budget: '$500 - $1,000',
          duration: 'Ongoing',
          location: 'Remote',
          skills: ['Writing', 'SEO', 'Marketing'],
          postedBy: 'Marketing Agency',
          postedAt: '3 days ago',
          status: 'open'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || job.skills.some(skill => 
      skill.toLowerCase().includes(selectedCategory.toLowerCase())
    )
    return matchesSearch && matchesCategory
  })

  return (
    <>
      <Head>
        <title>Browse Jobs - The Bridge</title>
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
              Browse Freelance Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Find opportunities that match your skills
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="web">Web Development</option>
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

          {/* Jobs List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No jobs found matching your criteria.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {job.description}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.budget}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {job.postedBy}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Posted {job.postedAt}
                    </span>
                    <Link
                      href={`/freelance/job/${job.id}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
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
