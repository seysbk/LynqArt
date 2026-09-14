import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons'

export function ImageUpload({ label, value, onChange, accept = 'image/*', hint, multiple = false, uploading = false, uploadMessage = 'Uploading image...', maxSizeMb = 10 }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [validationError, setValidationError] = useState('')

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null)),
    [selectedFiles],
  )

  useEffect(() => () => {
    previewUrls.forEach((url) => url && URL.revokeObjectURL(url))
  }, [previewUrls])

  const handleFiles = (files) => {
    if (!files || !files.length) return
    const nextFiles = multiple ? Array.from(files) : [files[0]]
    const invalidType = nextFiles.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    const invalidSize = nextFiles.find((file) => file.size > maxSizeMb * 1024 * 1024)
    if (invalidType) {
      setValidationError('Use a JPG, PNG, or WEBP image.')
      return
    }
    if (invalidSize) {
      setValidationError(`Each image must be ${maxSizeMb} MB or smaller.`)
      return
    }
    setValidationError('')
    setSelectedFiles(nextFiles)
    if (multiple) {
      onChange(nextFiles)
    } else {
      onChange(nextFiles[0])
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (uploading) return
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
      onClick={() => !uploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
        onKeyDown={(event) => {
          if (uploading) return
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
        disabled={uploading}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
        {selectedFiles.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="relative overflow-hidden rounded-xl border border-white/[0.1] bg-[#0D0F14]">
                {previewUrls[index] ? (
                  <img src={previewUrls[index]} alt={file.name} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-xs text-slate-300">{file.name}</div>
                )}
                <p className="truncate px-3 py-2 text-left text-[11px] text-slate-300">{file.name}</p>
                {uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 text-xs font-semibold text-white">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                    <span aria-live="polite">{uploadMessage}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icon name="image" className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="text-xs text-slate-400 max-w-xs">{hint || 'Drag & drop high resolution artwork image, or click to upload'}</p>
          </div>
        )}
        {uploading && selectedFiles.length === 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300" aria-live="polite">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" aria-hidden="true" />
            <span>{uploadMessage}</span>
          </div>
        )}
        {validationError && (
          <p className="mt-3 text-xs font-medium text-rose-300" role="alert">{validationError}</p>
        )}
    </div>
  )
}
