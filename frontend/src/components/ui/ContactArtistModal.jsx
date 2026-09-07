import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from './Button'

const inputClass = 'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

export function ContactArtistModal({ artist, artwork, onClose }) {
  const [form, setForm] = useState({ sender_name: '', sender_email: '', inquiry_type: 'general', message: '' })
  const [state, setState] = useState({ saving: false, error: '', success: false })

  const submit = async (event) => {
    event.preventDefault()
    setState({ saving: true, error: '', success: false })
    try {
      await api.post('/accounts/inquiries/', { ...form, artist_id: artist.id, artwork: artwork?.id || null })
      setState({ saving: false, error: '', success: true })
    } catch (error) {
      setState({ saving: false, error: Object.values(error.response?.data || {}).flat().join(' ') || 'Unable to send inquiry.', success: false })
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Contact artist">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141720] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-indigo-400">Private inquiry</p><h2 className="text-xl font-bold text-white">Contact {artist.full_name || artist.username}</h2></div>
          <button type="button" onClick={onClose} className="h-11 w-11 rounded-full text-slate-400 hover:text-white" aria-label="Close contact form"><X className="mx-auto h-5 w-5" /></button>
        </div>
        {state.success ? <div className="space-y-4"><p className="text-sm text-slate-300">Your inquiry has been sent to the artist.</p><Button type="button" onClick={onClose}>Close</Button></div> : (
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Your name" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} className={inputClass} />
            <input required type="email" placeholder="Your email" value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} className={inputClass} />
            <select value={form.inquiry_type} onChange={(e) => setForm({ ...form, inquiry_type: e.target.value })} className={inputClass}><option value="general">General inquiry</option><option value="acquisition">Acquisition / purchase inquiry</option><option value="exhibition">Exhibition invitation</option></select>
            <textarea required minLength={10} rows={5} placeholder="Write your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} />
            {state.error && <p className="text-xs text-rose-400">{state.error}</p>}
            <Button type="submit" disabled={state.saving}>{state.saving ? 'Sending...' : 'Send inquiry'}</Button>
          </form>
        )}
      </div>
    </div>
  )
}