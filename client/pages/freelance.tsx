import Head from 'next/head'
import Link from 'next/link'
import { Briefcase, UserCheck, Search, FileText, DollarSign, TrendingUp } from 'lucide-react'

export default function FreelancePage() {
  return (
    <>
      <Head>
        <title>Jobs - The Bridge</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Find Work or Hire Talent
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose your path and start growing your career or business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Freelancer Card */}
            <Link
              href="/freelance/profile"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 md:p-12">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                  <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Continue as a Freelancer
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Find projects that match your skills, build your portfolio, and grow your freelance career
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Browse available jobs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Submit proposals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Get paid securely</span>
                  </li>
                </ul>
                <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Set Up Profile
                </div>
              </div>
            </Link>

            {/* Hire Card */}
            <Link
              href="/freelance/hire"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 md:p-12">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                  <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Continue as a Hire
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Post jobs, find talented professionals, and build your team with confidence
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Post job openings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Browse freelancers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Track project progress</span>
                  </li>
                </ul>
                <div className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  Hire Talent
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
