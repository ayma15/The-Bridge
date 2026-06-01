import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Camera, X, Search } from 'lucide-react'

const SKILL_OPTIONS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'PostgreSQL',
  'Prisma',
  'MongoDB',
  'TailwindCSS',
  'UI/UX Design',
  'Figma',
  'Graphic Design',
  'Content Writing',
  'SEO',
  'Social Media',
  'Video Editing',
  'WordPress',
  'Python',
  'Django',
  'Laravel',
  'PHP',
  'Java',
  'C#',
  'Flutter',
  'React Native',
]

export default function FreelancerProfilePage() {
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillsQuery, setSkillsQuery] = useState('')
  const [telegramChannel, setTelegramChannel] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [availability, setAvailability] = useState('AVAILABLE')
  const [experience, setExperience] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const filteredSkillOptions = useMemo(() => {
    const q = skillsQuery.trim().toLowerCase()
    const selected = new Set(selectedSkills.map(s => s.toLowerCase()))
    return SKILL_OPTIONS
      .filter(s => !selected.has(s.toLowerCase()))
      .filter(s => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 24)
  }, [skillsQuery, selectedSkills])

  const addSkill = (skill: string) => {
    if (!skill) return
    if (selectedSkills.includes(skill)) return
    setSelectedSkills(prev => [...prev, skill])
    setSkillsQuery('')
  }

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill))
  }

  const handlePhotoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingPhoto(true)
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post('/api/freelance/profile/photo', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data?.url) {
        setProfilePhotoUrl(res.data.url)
        toast.success('Photo uploaded')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/freelance/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const p = res.data?.profile
      if (p) {
        setBio(p.bio || '')
        setSelectedSkills(Array.isArray(p.skills) ? p.skills.filter(Boolean) : [])
        setTelegramChannel(p.telegramChannel || '')
        setDisplayName(p.displayName || '')
        setContactEmail(p.contactEmail || '')
        setContactPhone(p.contactPhone || '')
        setProfilePhotoUrl(p.profilePhotoUrl || '')
        setAvailability(p.availability || 'AVAILABLE')
        setExperience(p.experience || '')
        setYearsOfExperience(p.yearsOfExperience ? String(p.yearsOfExperience) : '')
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const payload: any = {
        bio,
        skills: selectedSkills,
        telegramChannel,
        displayName,
        availability,
        experience,
      }
      if (contactEmail.trim()) payload.contactEmail = contactEmail.trim()
      if (contactPhone.trim()) payload.contactPhone = contactPhone.trim()
      if (profilePhotoUrl.trim()) payload.profilePhotoUrl = profilePhotoUrl.trim()
      if (yearsOfExperience && !isNaN(Number(yearsOfExperience))) payload.yearsOfExperience = parseInt(yearsOfExperience, 10)

      await axios.post('/api/freelance/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Profile saved')
      router.push('/freelance/browse')
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message
      const firstValidationMsg = err?.response?.data?.errors?.[0]?.msg
      toast.error(serverMessage || firstValidationMsg || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Freelancer Profile - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Set up your Freelancer Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Complete your profile to start getting hired.</p>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
            {/* Personal / Contact */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Personal & Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:opacity-90"
                      aria-label="Change profile photo"
                    >
                      {profilePhotoUrl ? (
                        <Image src={profilePhotoUrl} alt="avatar" fill sizes="64px" className="object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] py-1 text-center">
                        {uploadingPhoto ? 'Uploading…' : 'Change'}
                      </div>
                    </button>

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />

                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="font-medium text-gray-900 dark:text-white">Tip</div>
                      <div>Square image works best. PNG/JPG/WebP.</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Professional Details</h2>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tell clients about your experience, projects, and strengths"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 text-sm">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:opacity-80"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={skillsQuery}
                    onChange={(e) => setSkillsQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search skills and click to add"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {filteredSkillOptions.length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No matches</span>
                  ) : (
                    filteredSkillOptions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {skill}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience (summary)</label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Summarize your professional experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telegram Channel (optional)</label>
              <input
                type="url"
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://t.me/your_channel"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/freelance')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
