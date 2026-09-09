import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from './Button'

const inputClass = 'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

export function FeedbackModal({ session, onClose }) {
  const user = session?.user
  const [form, setForm] = useState({
    sender_name: user?.full_name || user?.username || '',
    sender_email: user?.email || '',
    category: 'general',
    message: '',
  })
  const [state, setState] = useState({ saving: false, error: '', success: false })

  const submit = async (event) => {
    event.preventDefault()
    setState({ saving: true, error: '', success: false })
    try {
      await api.post('/accounts/feedback/', {
        ...form,
        page_url: window.location.href,
      })
      setState({ saving: false, error: '', success: true })
    } catch (error) {
      const response = error.response?.data || {}
      const message = Object.values(response).flat().join(' ') || 'Unable to send feedback. Please try again.'
      setState({ saving: false, error: message, success: false })
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Give feedback">
      <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#141720] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-400">Help us improve</p>
            <h2 className="text-xl font-bold text-white">Give feedback</h2>
          </div>
          <button type="button" onClick={onClose} className="h-11 w-11 rounded-full text-slate-400 hover:text-white" aria-label="Close feedback form">
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>

        {state.success ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Thanks for helping improve LynqArt. Your feedback has been received.</p>
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Your name (optional)" value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} className={inputClass} />
              <input type="email" placeholder="Email (optional)" value={form.sender_email} onChange={(e) => setForm({ ...form, sender_email: e.target.value })} className={inputClass} />
            </div>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              <option value="general">General feedback</option>
              <option value="bug">Report a problem</option>
              <option value="idea">Feature idea</option>
              <option value="content">Content or accessibility feedback</option>
            </select>
            <textarea required minLength={10} rows={6} placeholder="Tell us what you think (at least 10 characters)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} />
            {state.error && <p className="text-xs text-rose-400">{state.error}</p>}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose} disabled={state.saving}>Cancel</Button>
              <Button type="submit" disabled={state.saving}>{state.saving ? 'Sending...' : 'Send feedback'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
