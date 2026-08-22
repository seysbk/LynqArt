import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Bell, Check, CheckCheck } from 'lucide-react'

export function NotificationsCenter({ session }) {
  const user = session?.user
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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
      fetchNotifications()
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
      const unread = notifications.filter((n) => !n.is_read)
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}/`, { is_read: true })))
      setNotifications(notifications.map((item) => ({ ...item, is_read: true })))
    } catch {
      // noop
    }
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

            <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
              {loading ? (
                <p className="p-4 text-center text-[#71717A]">Loading notifications...</p>
              ) : notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-start gap-3 transition ${
                      item.is_read ? 'bg-transparent' : 'bg-indigo-500/10'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-[#F4F4F5]">{item.title}</p>
                      <p className="text-[#A1A1AA] leading-relaxed">{item.message}</p>
                      <span className="text-[10px] text-[#71717A] block pt-0.5">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="text-slate-400 hover:text-indigo-400 p-1 rounded shrink-0"
                        title="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-[#71717A]">No notifications yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
