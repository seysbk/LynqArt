import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Bell, Check, CheckCheck, ChevronDown, ChevronUp, Mail, Copy, ExternalLink, X } from 'lucide-react'

export function NotificationsCenter({ session }) {
  const user = session?.user
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [replyModalItem, setReplyModalItem] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchNotifications = async () => {
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
  }

  useEffect(() => {
    if (user) {
      const initialFetch = window.setTimeout(fetchNotifications, 0)
      const interval = window.setInterval(fetchNotifications, 45000)
      return () => {
        window.clearTimeout(initialFetch)
        window.clearInterval(interval)
      }
    }
  }, [user])

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
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] bg-[#141720] border border-white/[0.1] shadow-2xl z-50 overflow-hidden text-xs">
            <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#191C27]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-[#F4F4F5]">Notifications Center</span>
              </div>
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
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
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
        </>
      )}

      {/* Reply Draft Modal */}
      {replyModalItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="surface-card w-full max-w-lg p-5 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Mail className="h-4 w-4" />
                <span>Compose Reply Email Draft</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
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
        </div>
      )}
    </div>
  )
}

