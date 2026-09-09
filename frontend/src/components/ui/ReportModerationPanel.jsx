import { useEffect, useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { api } from '../../lib/api'

const statuses = [
  ['reviewed', 'Reviewed'],
  ['dismissed', 'Dismissed'],
  ['actioned', 'Actioned'],
]

export function ReportModerationPanel() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState({})

  const loadReports = async () => {
    try {
      const { data } = await api.get('/comments/reports/', { params: { ordering: '-created_at' } })
      const items = data.results || data || []
      setReports(items)
      setDrafts(Object.fromEntries(items.map((report) => [report.id, {
        status: report.status === 'pending' ? 'reviewed' : report.status,
        moderator_notes: report.moderator_notes || '',
      }])))
    } catch {
      setMessage('Could not load moderation reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }))
  }

  const reviewReport = async (report) => {
    const draft = drafts[report.id]
    if (!draft) return
    setSavingId(report.id)
    setMessage('')
    try {
      const { data } = await api.patch(`/comments/reports/${report.id}/`, draft)
      setReports((current) => current.map((item) => (item.id === report.id ? data : item)))
      setMessage('Report updated. The reporter has been notified with the moderator notes.')
    } catch (error) {
      setMessage(Object.values(error.response?.data || {}).flat().join(' ') || 'Could not update report.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="surface-card space-y-5 border-amber-500/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Moderator workspace</span>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#F4F4F5]"><ShieldCheck className="h-5 w-5 text-amber-400" /> Content reports</h2>
          <p className="mt-1 text-xs text-[#A1A1AA]">Review reports and send the reporter your status and moderator notes.</p>
        </div>
        <span className="rounded bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300">{reports.length} reports</span>
      </div>

      {message && <p role="status" aria-live="polite" className="rounded border border-indigo-400/20 bg-indigo-500/10 p-3 text-xs text-indigo-200">{message}</p>}

      {loading ? (
        <p className="text-xs text-[#71717A]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-xs text-[#71717A]">No reports have been submitted.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const draft = drafts[report.id] || { status: 'reviewed', moderator_notes: '' }
            return (
              <article key={report.id} className="space-y-3 rounded-[10px] border border-white/[0.08] bg-[#0D0F14] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-[#F4F4F5]">{report.target_label || 'Reported content'}</p>
                    <p className="text-[#A1A1AA]">Reason: <span className="capitalize text-[#F4F4F5]">{report.reason?.replaceAll('_', ' ')}</span></p>
                    <p className="text-[10px] text-[#71717A]">Submitted {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${report.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {report.status}
                  </span>
                </div>
                {report.details && <p className="whitespace-pre-wrap border-l-2 border-white/[0.1] pl-3 text-xs leading-relaxed text-[#A1A1AA]">{report.details}</p>}
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <label className="space-y-1 text-[11px] text-[#A1A1AA]">
                    <span>Status</span>
                    <select value={draft.status} onChange={(event) => updateDraft(report.id, 'status', event.target.value)} className="w-full rounded-[8px] border border-white/[0.09] bg-[#141720] px-2.5 py-2 text-xs text-[#F4F4F5] outline-none focus:border-amber-400">
                      {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-[11px] text-[#A1A1AA]">
                    <span>Moderator notes</span>
                    <textarea rows={3} value={draft.moderator_notes} onChange={(event) => updateDraft(report.id, 'moderator_notes', event.target.value)} placeholder="Explain the decision to the reporter" className="w-full rounded-[8px] border border-white/[0.09] bg-[#141720] px-3 py-2 text-xs text-[#F4F4F5] outline-none focus:border-amber-400" />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => reviewReport(report)} disabled={savingId === report.id} className="inline-flex items-center gap-2 rounded-[8px] bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" />
                    {savingId === report.id ? 'Submitting...' : 'Submit review'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
