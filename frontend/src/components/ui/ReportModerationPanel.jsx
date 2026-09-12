import { useEffect, useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { api } from '../../lib/api'

const statuses = [
  ['pending', 'Pending review'],
  ['reviewed', 'Reviewed'],
  ['dismissed', 'Dismissed'],
  ['actioned', 'Actioned'],
  ['escalated', 'Escalated to staff'],
]

export function ReportModerationPanel({ isStaff = false }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState({})

  const loadReports = async () => {
    try {
      const params = { ordering: '-created_at' }
      if (!isStaff) params.status = 'pending'
      const { data } = await api.get('/comments/reports/', { params })
      const items = data.results || data || []
      setReports(items)
      setDrafts(Object.fromEntries(items.map((report) => [report.id, {
        status: report.status === 'pending' ? 'reviewed' : report.status,
        status: report.status || 'pending',
        action: report.status === 'dismissed' ? 'dismiss' : 'resolve',
        internal_note: report.moderator_notes || '',
        public_response: report.moderator_response || '',
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
      await api.post(`/comments/reports/${report.id}/moderate/`, draft)
      if (!isStaff) setReports((current) => current.filter((item) => item.id !== report.id))
      else await loadReports()
      setMessage('Report action recorded. Staff can review the moderation history.')
    } catch (error) {
      setMessage(Object.values(error.response?.data || {}).flat().join(' ') || 'Could not update report.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="surface-card space-y-3 border-amber-500/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#F4F4F5]"><ShieldCheck className="h-4 w-4 text-amber-400" /> Moderator workspace</h2>
          <p className="mt-0.5 text-[11px] text-[#71717A]">Scan new reports and open one to review.</p>
        </div>
        <span className="rounded bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300">{reports.length} open</span>
      </div>

      {message && <p role="status" aria-live="polite" className="rounded border border-indigo-400/20 bg-indigo-500/10 p-3 text-xs text-indigo-200">{message}</p>}

      {loading ? (
        <p className="text-xs text-[#71717A]">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-xs text-[#71717A]">No reports have been submitted.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => {
            const draft = drafts[report.id] || { status: report.status, action: 'resolve', internal_note: '', public_response: '' }
            return (
              <article key={report.id} className="space-y-2 rounded-lg border border-white/[0.08] bg-[#0D0F14] p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 text-xs">
                    <p className="truncate font-semibold text-[#F4F4F5]">{report.target_label || 'Reported content'}</p>
                    <p className="truncate text-[10px] text-[#71717A]">
                      <span className="capitalize">{report.reason?.replaceAll('_', ' ')}</span> · {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${report.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {report.status}
                  </span>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-semibold text-indigo-300 group-open:mb-2">Review report</summary>
                  <div className="space-y-2">
                    {report.details && <p className="whitespace-pre-wrap border-l-2 border-white/[0.1] pl-2 text-[11px] leading-relaxed text-[#A1A1AA]">{report.details}</p>}
                    <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                      <label className="space-y-1 text-[10px] text-[#A1A1AA]">
                        <span>Status</span>
                        <select value={draft.status} onChange={(event) => updateDraft(report.id, 'status', event.target.value)} className="w-full rounded-md border border-white/[0.09] bg-[#141720] px-2 py-1.5 text-[11px] text-[#F4F4F5] outline-none focus:border-amber-400">
                          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-[10px] text-[#A1A1AA]">
                        <span>Internal note</span>
                        <textarea rows={2} value={draft.internal_note} onChange={(event) => updateDraft(report.id, 'internal_note', event.target.value)} placeholder="Reasoning for staff" className="w-full rounded-md border border-white/[0.09] bg-[#141720] px-2.5 py-1.5 text-[11px] text-[#F4F4F5] outline-none focus:border-amber-400" />
                      </label>
                    </div>
                    <label className="block space-y-1 text-[10px] text-[#A1A1AA]">
                      <span>Response to reporter</span>
                      <textarea rows={2} value={draft.public_response} onChange={(event) => updateDraft(report.id, 'public_response', event.target.value)} placeholder="Optional response" className="w-full rounded-md border border-white/[0.09] bg-[#141720] px-2.5 py-1.5 text-[11px] text-[#F4F4F5] outline-none focus:border-amber-400" />
                    </label>
                    {report.actions?.length > 0 && (
                      <details className="border-t border-white/[0.06] pt-2 text-[10px] text-[#A1A1AA]">
                        <summary className="cursor-pointer font-semibold text-[#F4F4F5]">History ({report.actions.length})</summary>
                        <div className="mt-1 space-y-1">
                          {report.actions.map((item) => <p key={item.id}>{item.action.replaceAll('_', ' ')} by {item.actor?.username || 'former moderator'} — {new Date(item.created_at).toLocaleString()}</p>)}
                        </div>
                      </details>
                    )}
                    <div className="flex justify-end">
                      <button type="button" onClick={() => reviewReport(report)} disabled={savingId === report.id} className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50">
                        <Check className="h-3 w-3" />
                        {savingId === report.id ? 'Saving...' : 'Save review'}
                      </button>
                    </div>
                  </div>
                </details>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
