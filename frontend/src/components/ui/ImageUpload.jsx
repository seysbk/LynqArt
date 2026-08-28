import React, { useRef, useState } from 'react'
import { Icon } from './Icons'

export function ImageUpload({ label, value, onChange, accept = 'image/*', hint, multiple = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files) => {
    if (!files || !files.length) return
    if (multiple) {
      onChange(Array.from(files))
    } else {
      onChange(files[0])
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
          : 'border-slate-800 bg-slate-950/60 hover:border-indigo-500/50 hover:bg-slate-900/60'
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Icon name="image" className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-slate-400 max-w-xs">{hint || 'Drag & drop high resolution artwork image, or click to upload'}</p>
      </div>
    </div>
  )
}