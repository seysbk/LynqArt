import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from './Button'

const reasons = [
  ['inappropriate', 'Inappropriate content / NSFW'],
  ['harassment', 'Harassment or hate speech'],
  ['spam', 'Spam or advertising'],
  ['copyright', 'Copyright or intellectual property infringement'],
  ['other', 'Other violation'],
]

export function ReportContentModal({ target, onClose }) {
  const [reason, setReason] = useState('inappropriate')
  const [details, setDetails] = useState('')
  const [state, setState] = useState({ saving: false, error: '', success: false })

  const submit = async (event) => {
    event.preventDefault()
    setState({ saving: true, error: '', success: false })
    try {
      await api.post('/comments/reports/', { ...target, reason, details })
      setState({ saving: false, error: '', success: true })
    } catch (error) {
      setState({
        saving: false,
        success: false,
        error: Object.values(error.response?.data || {}).flat().join(' ') || 'Unable to submit report.',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="report-content-title">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141720] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-400">Moderation report</p>
            <h2 id="report-content-title" className="text-xl font-bold text-white">Report content</h2>
          </div>
          <button type="button" onClick={onClose} className="h-11 w-11 rounded-full text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label="Close report form">
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>
        {state.success ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Thank you. The LynqArt moderation team will review this report.</p>
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-slate-200">Reason</legend>
              {reasons.map(([value, label]) => (
                <label key={value} className="flex min-h-11 items-center gap-3 text-xs text-slate-300">
                  <input type="radio" name="report-reason" value={value} checked={reason === value} onChange={(event) => setReason(event.target.value)} className="h-4 w-4 accent-indigo-500" />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <textarea
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add context (optional)"
              className="w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 placeholder:text-[#94A3B8]"
            />
            {state.error && <p className="text-xs text-rose-400">{state.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={state.saving}>{state.saving ? 'Sending...' : 'Submit report'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
