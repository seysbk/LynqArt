import React from 'react'
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ isOpen, onClose, title, message, type = 'info', confirmText = 'OK', cancelText = null, onConfirm = null }) {
  if (!isOpen) return null

  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
    error: <XCircle className="h-6 w-6 text-red-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-400" />,
    info: <Info className="h-6 w-6 text-indigo-400" />,
  }

  const borderColors = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    warning: 'border-amber-500/30',
    info: 'border-indigo-500/30',
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`surface-card w-full max-w-md p-6 space-y-4 border ${borderColors[type]} shadow-2xl relative`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717A] hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 pt-0.5">{icons[type]}</div>
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-[#F4F4F5]">{title}</h3>
            {message && <p className="text-xs text-[#A1A1AA] leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          {cancelText && (
            <Button type="button" variant="secondary" onClick={onClose} className="!py-1.5 !px-3 text-xs">
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={type === 'error' || type === 'warning' ? 'primary' : 'primary'}
            onClick={handleConfirm}
            className={`!py-1.5 !px-4 text-xs ${
              type === 'error' || (type === 'warning' && confirmText.toLowerCase().includes('delete'))
                ? 'bg-red-600 hover:bg-red-500 text-white border-none'
                : ''
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
