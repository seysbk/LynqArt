import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { User, ShieldCheck, Check, Sparkles, ImagePlus, Trash2 } from 'lucide-react'

const inputClass =
  'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

export function ProfilePage({ session }) {
  const [userProfile, setUserProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingUser, setSavingUser] = useState(false)
  const [savingArtist, setSavingArtist] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarDragging, setAvatarDragging] = useState(false)
  const [userMessage, setUserMessage] = useState('')
  const [artistMessage, setArtistMessage] = useState('')

  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  })

  const [artistForm, setArtistForm] = useState({
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
      .then(([uRes, aRes]) => {
        if (!alive) return
        setUserProfile(uRes.data)
        setUserForm({
          first_name: uRes.data.first_name || '',
          last_name: uRes.data.last_name || '',
          email: uRes.data.email || '',
        })

        if (aRes.data) {
          setArtistProfile(aRes.data)
          setArtistForm({
            bio: aRes.data.bio || '',
            location: aRes.data.location || '',
            phone: aRes.data.phone || '',
            website: aRes.data.website || '',
            instagram: aRes.data.instagram || '',
            twitter: aRes.data.twitter || '',
          })
        }
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setUserMessage('Could not load profile details.')
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const currentAvatarUrl = artistProfile?.avatar_url ? mediaUrl(artistProfile.avatar_url) : ''

  const uploadAvatar = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setArtistMessage('Please choose a valid image file (PNG, JPG or WEBP).')
      return
    }
    setUploadingAvatar(true)
    setArtistMessage('')
    try {
      const payload = new FormData()
      payload.append('avatar', file)
      const { data } = await api.patch('/accounts/artist-profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setArtistProfile(data)
      setArtistMessage('Profile picture updated successfully.')
    } catch (err) {
      setArtistMessage(err?.response?.data?.detail || 'Could not upload profile picture.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarSelected = (event) => {
    const file = event.target.files?.[0]
    if (file) uploadAvatar(file)
    event.target.value = ''
  }

  const handleAvatarDrop = (event) => {
    event.preventDefault()
    setAvatarDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) uploadAvatar(file)
  }

  const handleRemoveAvatar = async () => {
    try {
      const { data } = await api.delete('/accounts/artist-profile/')
      setArtistProfile(data)
      setArtistMessage('Profile picture removed.')
    } catch {
      setArtistMessage('Could not remove profile picture.')
    }
  }

  const saveUserAccount = async (event) => {
    event.preventDefault()
    setSavingUser(true)
    setUserMessage('')
    try {
      const { data } = await api.patch('/accounts/profile/', userForm)
      setUserProfile(data)
      setUserMessage('Account details updated successfully.')
      if (session?.refresh) session.refresh()
    } catch (err) {
      setUserMessage(err?.response?.data?.detail || 'Could not update user details.')
    } finally {
      setSavingUser(false)
    }
  }

  const saveArtistDetails = async (event) => {
    event.preventDefault()
    setSavingArtist(true)
    setArtistMessage('')
    try {
      await api.patch('/accounts/artist-profile/', artistForm)
      setArtistMessage('Artist profile details updated successfully.')
    } catch (err) {
      setArtistMessage(err?.response?.data?.detail || 'Could not update artist details.')
    } finally {
      setSavingArtist(false)
    }
  }

  if (loading) return <LoadingState title="Loading Profile" description="Fetching account details..." />

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">User Account</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F4F5]">Account &amp; Artist Settings</h1>
        </div>

        <Link to="/dashboard">
          <Button variant="secondary" className="!py-1.5 text-xs">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* User Info Overview Banner */}
      <div className="surface-card p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-indigo-400 shrink-0">
          {userProfile?.is_artist ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-base font-bold text-[#F4F4F5]">
            {userProfile?.full_name || userProfile?.username}
          </p>
          <p className="text-xs text-[#71717A]">
            Username: <span className="font-mono text-[#A1A1AA]">{userProfile?.username}</span> · Role:{' '}
            {userProfile?.is_artist ? (
              <span className="text-indigo-400 font-semibold">Artist</span>
            ) : (
              <span>Member</span>
            )}
          </p>
        </div>
      </div>

      {/* 1. Account Details Form */}
      <form onSubmit={saveUserAccount} className="surface-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#F4F4F5] flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-400" />
          <span>Personal Account Information</span>
        </h2>

        {userMessage && (
          <div className="rounded-[9px] bg-indigo-500/10 border border-indigo-500/30 p-2.5 text-xs text-indigo-300">
            {userMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
            First Name
            <input
              required
              value={userForm.first_name}
              onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
            Last Name
            <input
              required
              value={userForm.last_name}
              onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
          Email Address
          <input
            required
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            className={inputClass}
          />
        </label>

        <div className="pt-2">
          <Button type="submit" variant="primary" disabled={savingUser} className="text-xs">
            <Check className="h-4 w-4" />
            <span>{savingUser ? 'Saving Account...' : 'Save Account Info'}</span>
          </Button>
        </div>
      </form>

      {/* 2. Artist Profile Details Form (Details filled out during "Become an Artist") */}
      {userProfile?.is_artist ? (
        <form onSubmit={saveArtistDetails} className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F4F5] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Artist Profile Details</span>
            </h2>
            <span className="text-[11px] text-indigo-300 font-semibold">Artist Credentials</span>
          </div>

          <p className="text-xs text-[#A1A1AA]">
            Edit the public bio, location, contact, and portfolio links you filled out when becoming an artist.
          </p>

          {artistMessage && (
            <div className="rounded-[9px] bg-indigo-500/10 border border-indigo-500/30 p-2.5 text-xs text-indigo-300">
              {artistMessage}
            </div>
          )}

          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-[#A1A1AA]">Profile Picture</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#191C27] border border-white/[0.09] flex items-center justify-center text-indigo-400 overflow-hidden shrink-0">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="Current profile picture" className="h-full w-full object-cover" />
                ) : (
                  <ShieldCheck className="h-6 w-6" />
                )}
              </div>

              <label
                className={`flex-1 flex items-center gap-3 rounded-[9px] border border-dashed px-4 py-3 cursor-pointer transition ${
                  avatarDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-white/[0.12] bg-[#0D0F14] hover:border-indigo-400/60 hover:bg-white/[0.02]'
                }`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setAvatarDragging(true)
                }}
                onDragLeave={() => setAvatarDragging(false)}
                onDrop={handleAvatarDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingAvatar}
                  className="hidden"
                  onChange={handleAvatarSelected}
                />
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#F4F4F5]">
                    {uploadingAvatar ? 'Uploading...' : 'Click to upload or drag & drop'}
                  </span>
                  <span className="block text-[11px] text-[#71717A]">PNG, JPG or WEBP image</span>
                </span>
              </label>

              {currentAvatarUrl && (
                <Button
                  variant="secondary"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="!py-1.5 !px-3 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>

          <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
            Artist Bio &amp; Creative Statement *
            <textarea
              required
              rows={4}
              value={artistForm.bio}
              onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
              placeholder="Describe your artistic focus and background..."
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Studio / City Location *
              <input
                required
                value={artistForm.location}
                onChange={(e) => setArtistForm({ ...artistForm, location: e.target.value })}
                placeholder="e.g. New York, NY"
                className={inputClass}
              />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Phone Number
              <input
                value={artistForm.phone}
                onChange={(e) => setArtistForm({ ...artistForm, phone: e.target.value })}
                placeholder="Phone (optional)"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Portfolio Website
              <input
                type="url"
                value={artistForm.website}
                onChange={(e) => setArtistForm({ ...artistForm, website: e.target.value })}
                placeholder="https://example.com"
                className={inputClass}
              />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Instagram Handle
              <input
                value={artistForm.instagram}
                onChange={(e) => setArtistForm({ ...artistForm, instagram: e.target.value })}
                placeholder="@username"
                className={inputClass}
              />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Twitter / X Handle
              <input
                value={artistForm.twitter}
                onChange={(e) => setArtistForm({ ...artistForm, twitter: e.target.value })}
                placeholder="@username"
                className={inputClass}
              />
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button type="submit" variant="primary" disabled={savingArtist} className="text-xs">
              <Check className="h-4 w-4" />
              <span>{savingArtist ? 'Saving Artist Details...' : 'Save Artist Profile'}</span>
            </Button>

            {userProfile?.id && (
              <Link
                to={`/artists/${userProfile.id}/${encodeURIComponent((userProfile.full_name || userProfile.username || '').toLowerCase().replace(/\s+/g, '-'))}`}
                target="_blank"
                className="text-xs text-indigo-400 hover:underline"
              >
                View Public Artist Page &rarr;
              </Link>
            )}
          </div>
        </form>
      ) : (
        <div className="surface-card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[#F4F4F5]">Artist Enrollment</h2>
          <p className="text-xs text-[#A1A1AA]">
            You have not activated your artist status yet. To publish artworks and write artist statements, visit the dashboard and click "Become an Artist".
          </p>
          <Link to="/dashboard">
            <Button variant="primary" className="!py-1.5 text-xs">
              Go to Dashboard to Become an Artist
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
