'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import type { Notification } from '@/lib/types'
import { BellIcon, CheckIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications((data || []) as Notification[])
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user!.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const claimCandidate = async (notification: Notification) => {
    const candidateId = notification.data?.candidate_id as string
    if (!candidateId) return

    const { error } = await supabase
      .from('candidate_claims')
      .insert({
        candidate_id: candidateId,
        recruiter_id: user!.id,
        action: 'claimed',
      })

    if (!error) {
      markAsRead(notification.id)
    }
  }

  const passCandidate = async (notification: Notification) => {
    const candidateId = notification.data?.candidate_id as string
    if (!candidateId) return

    await supabase
      .from('candidate_claims')
      .insert({
        candidate_id: candidateId,
        recruiter_id: user!.id,
        action: 'passed',
      })

    markAsRead(notification.id)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BellIcon className="w-5 h-5 text-dark-text-secondary" />
          <span className="text-sm text-dark-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellIcon className="w-12 h-12 text-dark-text-secondary/30 mx-auto mb-3" />
          <p className="text-dark-text-secondary">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-dark-card rounded-2xl border p-4 transition-all ${
                notification.is_read
                  ? 'border-dark-border opacity-60'
                  : 'border-accent/30 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-text">{notification.title}</p>
                  {notification.body && (
                    <p className="text-xs text-dark-text-secondary mt-1 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-[10px] text-dark-text-secondary/60 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Action buttons for candidate_rejected notifications */}
                {notification.type === 'candidate_rejected' && !notification.is_read && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => claimCandidate(notification)}
                      className="px-3 py-1.5 bg-accent text-white text-xs rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1"
                    >
                      <UserPlusIcon className="w-3.5 h-3.5" />
                      Claim
                    </button>
                    <button
                      onClick={() => passCandidate(notification)}
                      className="px-3 py-1.5 bg-dark-bg text-dark-text-secondary text-xs rounded-lg hover:text-dark-text border border-dark-border hover:border-dark-text-secondary transition-colors"
                    >
                      Pass
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
