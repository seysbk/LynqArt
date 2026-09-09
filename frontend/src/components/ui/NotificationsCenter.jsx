import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../lib/api'
import { Bell, Check, CheckCheck, ChevronDown, ChevronUp, Mail, Copy, ExternalLink, X } from 'lucide-react'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

export function NotificationsCenter({ session }) {
  const user = session?.user
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [replyModalItem, setReplyModalItem] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await api.get('/notifications/', { params: { ordering: '-created_at' } })
      setNotifications(data.results || data || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refetch notifications on window focus
  useRefetchOnFocus(fetchNotifications, Boolean(user))

  useEffect(() => {
    if (user) {
      // Initial fetch immediately
      fetchNotifications()
      // Poll every 15 seconds (was 45 seconds)
      const interval = window.setInterval(fetchNotifications, 15000)
      return () => {
        window.clearInterval(interval)
      }
    }
  }, [user, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(
        notifications.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
      )
    } catch {
      // noop
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications(notifications.map((item) => ({ ...item, is_read: true })))
    } catch {
      // noop
    }
  }

  const toggleExpand = (id, event) => {
    if (event) event.stopPropagation()
    const next = new Set(expandedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
      markAsRead(id)
    }
    setExpandedIds(next)
  }

  const extractEmail = (item) => {
    if (item.sender_email) return item.sender_email
    const match = item.message?.match(/[\w.-]+@[\w.-]+\.\w+/)
    return match ? match[0] : ''
  }

  const getMailtoLink = (item) => {
    const email = extractEmail(item)
    if (!email) return '#'
    const subject = encodeURIComponent(`Re: [LynqArt] ${item.title}`)
    const body = encodeURIComponent(
      `Hi,\n\nThank you for reaching out via LynqArt.\n\n---\nOriginal Message:\n${item.message}\n`
    )
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const handleCopyDraft = (item) => {
    const email = extractEmail(item)
    const draftText = `To: ${email}\nSubject: Re: [LynqArt] ${item.title}\n\nHi,\n\nThank you for reaching out via LynqArt.\n\n---\nOriginal Message:\n${item.message}`
    navigator.clipboard.writeText(draftText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const newOpenState = !isOpen
          setIsOpen(newOpenState)
          // Refetch notifications when opening the dropdown
          if (newOpenState) {
            fetchNotifications()
          }
        }}
        className="relative h-10 w-10 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-slate-300 hover:text-white transition-all"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-slate-300 hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        createPortal(<>
          <div className="fixed inset-0 z-[9990]" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-3 top-[70px] z-[9991] max-h-[calc(100dvh-5.5rem)] overflow-hidden rounded-[12px] border border-white/[0.1] bg-[#141720] text-xs shadow-2xl sm:left-auto sm:right-4 sm:top-20 sm:w-96">
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#191C27]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-[#F4F4F5]">Notifications Center</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all as read</span>
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1 text-slate-400 hover:text-white" aria-label="Close notifications">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-9.75rem)] overflow-y-auto divide-y divide-white/[0.04] sm:max-h-96">
              {loading ? (
                <p className="p-4 text-center text-[#71717A]">Loading notifications...</p>
              ) : notifications.length > 0 ? (
                notifications.map((item) => {
                  const isExpanded = expandedIds.has(item.id)
                  const senderEmail = extractEmail(item)

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 space-y-2 transition cursor-pointer ${
                        item.is_read ? 'bg-transparent' : 'bg-indigo-500/10'
                      }`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#F4F4F5]">{item.title}</span>
                            {item.type && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/[0.06] text-indigo-300">
                                {item.type}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#71717A] block">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!item.is_read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className="text-slate-400 hover:text-indigo-400 p-1 rounded"
                              title="Mark read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(item.id, e)}
                            className="text-slate-400 hover:text-white p-1 rounded"
                            title={isExpanded ? 'Collapse' : 'Expand message'}
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Summary or Expanded View */}
                      {isExpanded ? (
                        <div className="pt-2 border-t border-white/[0.06] space-y-2 text-[#A1A1AA]">
                          <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs text-[#F4F4F5]">
                            {item.message}
                          </p>

                          {senderEmail && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <a
                                href={getMailtoLink(item)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition"
                              >
                                <Mail className="h-3 w-3" />
                                <span>Reply via Email Client</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReplyModalItem(item)
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-[11px] transition"
                              >
                                <span>View Reply Draft</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#A1A1AA] line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="p-6 text-center text-[#71717A]">No notifications yet.</p>
              )}
            </div>
          </div>
        </>, document.body)
      )}

      {/* Reply Draft Modal */}
      {replyModalItem && (
        createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center" onMouseDown={() => setReplyModalItem(null)} role="dialog" aria-modal="true" aria-label="Reply email draft">
          <div className="surface-card my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto border border-white/10 p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Mail className="h-4 w-4" />
                <span>Compose Reply Email Draft</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
                aria-label="Close reply draft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#71717A] block">To:</span>
                <span className="font-medium text-[#F4F4F5]">{extractEmail(replyModalItem)}</span>
              </div>

              <div>
                <span className="text-[#71717A] block">Subject:</span>
                <span className="font-medium text-[#F4F4F5]">Re: [LynqArt] {replyModalItem.title}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#71717A] block">Draft Body Preview:</span>
                <div className="p-3 rounded-lg bg-[#0D0F14] border border-white/[0.08] text-[#A1A1AA] whitespace-pre-wrap font-mono text-[11px] max-h-48 overflow-y-auto">
                  {`Hi,\n\nThank you for reaching out via LynqArt.\n\n---\nOriginal Message:\n${replyModalItem.message}`}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/[0.08] pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setReplyModalItem(null)}
                className="px-3 py-1.5 rounded border border-white/[0.09] text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCopyDraft(replyModalItem)}
                className="px-3 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
              </button>

              <a
                href={getMailtoLink(replyModalItem)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Submit / Open Email App</span>
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>
            </div>
          </div>
        </div>,
        document.body,
        )
      )}
    </div>
  )
}

