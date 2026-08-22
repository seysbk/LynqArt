import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { LoadingState } from '../../components/ui/LoadingState'
import { User, ShieldCheck, Trash2, LogOut, Check } from 'lucide-react'

const inputClass =
  'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

export function ProfilePage({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    instagram: '',
    twitter: '',
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/accounts/profile/'),
      api.get('/accounts/artist-profile/').catch(() => ({ data: null })),
    ])
      .then(([userRes, artistRes]) => {
        if (!alive) return
        setProfile(userRes.data)
        setArtistProfile(artistRes.data)
        setForm({
          first_name: userRes.data.first_name || '',
          last_name: userRes.data.last_name || '',
          bio: artistRes.data?.bio || '',
          location: artistRes.data?.location || '',
          phone: artistRes.data?.phone || '',
          website: artistRes.data?.website || '',
          instagram: artistRes.data?.instagram || '',
          twitter: artistRes.data?.twitter || '',
        })
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage('')
    try {
      const userRes = await api.patch('/accounts/profile/', {
        first_name: form.first_name,
        last_name: form.last_name,
      })
      let artistResData = artistProfile
      if (profile?.is_artist) {
        const artistRes = await api.patch('/accounts/artist-profile/', {
          bio: form.bio,
          location: form.location,
          phone: form.phone,
          website: form.website,
          instagram: form.instagram,
          twitter: form.twitter,
        })
        artistResData = artistRes.data
      }
      setProfile(userRes.data)
      setArtistProfile(artistResData)
      if (session.refresh) await session.refresh()
      setStatusMessage('Profile details saved successfully!')
    } catch {
      setStatusMessage('Error saving profile. Please check your inputs.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file) => {
    if (!file) return
    setStatusMessage('')
    try {
      const payload = new FormData()
      payload.append('avatar', file)
      const { data } = await api.patch('/accounts/artist-profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setArtistProfile(data)
      setStatusMessage('Profile picture uploaded successfully!')
    } catch {
      setStatusMessage('Could not upload profile picture.')
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const { data } = await api.delete('/accounts/artist-profile/')
      setArtistProfile(data)
      setStatusMessage('Profile picture removed.')
    } catch {
      setStatusMessage('Could not remove profile picture.')
    }
  }

  if (loading) return <LoadingState title="Loading Account Profile" description="Fetching user settings..." />

  const user = session.user || profile || {}
  const avatarImage = artistProfile?.avatar_url ? mediaUrl(artistProfile.avatar_url) : null

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Personal Settings</span>
          <h1 className="text-3xl font-extrabold text-[#F4F4F5]">Account &amp; Artist Profile</h1>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            session.logout()
            navigate('/login')
          }}
          className="!py-1.5 !px-3 text-xs shrink-0 text-red-400 border-red-500/20 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {statusMessage && (
        <div className="rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
          {statusMessage}
        </div>
      )}

      {/* Profile Header Summary */}
      <div className="surface-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group shrink-0">
          <div className="h-20 w-20 rounded-full bg-[#191C27] border border-white/[0.09] flex items-center justify-center text-indigo-400 overflow-hidden">
            {avatarImage ? (
              <img src={avatarImage} alt="Avatar" className="h-full w-full object-cover" />
            ) : profile?.is_artist ? (
              <ShieldCheck className="h-10 w-10" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold text-[#F4F4F5]">{profile?.full_name || profile?.username}</h2>
          <p className="text-xs text-[#71717A]">{profile?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
            {profile?.is_artist ? (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[11px]">
                Artist Account
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[#A1A1AA] text-[11px]">
                Regular User
              </span>
            )}
            {user.is_expert && <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px]">Lecturer</span>}
            {user.can_manage_exhibitions && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px]">Organizer</span>}
          </div>
        </div>
      </div>

      {/* Avatar Picture Upload Surface */}
      {profile?.is_artist && (
        <div className="surface-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F4F4F5]">Artist Profile Picture</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <ImageUpload label="Upload New Avatar Picture" onChange={handleAvatarUpload} />
            </div>
            {avatarImage && (
              <Button
                variant="secondary"
                onClick={handleRemoveAvatar}
                className="!py-1.5 !px-3 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove Avatar</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        <h2 className="text-sm font-semibold text-[#F4F4F5]">Personal Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
            First Name *
            <input
              required
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className={inputClass}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
            Last Name *
            <input
              required
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className={inputClass}
            />
          </label>
        </div>

        {profile?.is_artist && (
          <>
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h2 className="text-sm font-semibold text-[#F4F4F5]">Artist Bio &amp; Public Practice Details</h2>

              <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
                Artist Bio *
                <textarea
                  required
                  rows={4}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Describe your artistic background and practice..."
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
                  Location / Region *
                  <input
                    required
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Accra, Ghana"
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
                  Phone Contact
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+233..."
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
                  Website URL
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
                  Instagram Handle
                  <input
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    placeholder="@artist"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-white/[0.06]">
          <Button type="submit" variant="primary" disabled={saving} className="text-xs">
            <Check className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
