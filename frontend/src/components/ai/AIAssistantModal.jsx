import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, Check, RefreshCw, X, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'

export function AIAssistantModal({ artworkId, artworkTitle, artworkMedium, onAccept, onClose }) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('contemplative')
  const [generating, setGenerating] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState(null)
  const [error, setError] = useState('')

  const handleGenerate = async (event) => {
    event.preventDefault()
    if (!artworkId) {
      setError('Please save the artwork draft first before using the AI assistant.')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const { data } = await api.post('/ai/generations/generate_draft/', {
        artwork: artworkId,
        prompt: prompt || `Themes of memory, composition, and physical texture in ${artworkTitle || 'artwork'}`,
        tone,
      })
      setCurrentGeneration(data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not generate draft. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = async () => {
    if (!currentGeneration) return
    try {
      await api.patch(`/ai/generations/${currentGeneration.id}/`, { accepted: true })
      onAccept(currentGeneration.generated_text)
      onClose()
    } catch {
      // Fallback accept if PATCH fails
      onAccept(currentGeneration.generated_text)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="surface-card w-full max-w-2xl overflow-hidden border-white/[0.14] shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-[#F4F4F5]">AI Statement Writing Assistant</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#F4F4F5] p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-[9px] bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        {!currentGeneration ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Describe key themes, materials, inspirations, or concepts for <strong className="text-[#F4F4F5]">{artworkTitle || 'this artwork'}</strong>. The AI assistant will draft a structured Markdown statement for your review.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA]">Inspiration &amp; Concepts</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Focus on memory, temporal decay, contrasting smooth linen with raw bronze..."
                className="w-full rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-3 text-xs text-[#F4F4F5] outline-none focus:border-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#A1A1AA]">Statement Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-2.5 text-xs text-[#F4F4F5] outline-none"
              >
                <option value="contemplative">Contemplative &amp; Reflective</option>
                <option value="poetic">Poetic &amp; Evocative</option>
                <option value="academic">Academic &amp; Formal Critique</option>
                <option value="minimalist">Minimalist &amp; Direct</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-white/[0.06]">
              <Button type="button" variant="secondary" onClick={onClose} className="!py-1.5 text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={generating} className="!py-1.5 text-xs">
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{generating ? 'Drafting Statement...' : 'Generate Draft'}</span>
              </Button>
            </div>
          </form>
        ) : (
          /* Draft Review & Approval Panel */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] border-b border-white/[0.06] pb-2">
              <span>Generated Draft ({currentGeneration.model_used})</span>
              <span className="text-indigo-400 font-semibold">Artist Review Required</span>
            </div>

            <div className="surface-card p-4 max-h-[320px] overflow-y-auto prose prose-invert max-w-none text-xs text-[#F4F4F5] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentGeneration.generated_text}
              </ReactMarkdown>
            </div>

            <div className="rounded-[9px] bg-[#0D0F14] p-3 text-[11px] text-[#71717A] italic">
              Note: You can review, edit, or customize the draft statement after inserting it into your statement editor.
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.06]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentGeneration(null)}
                className="!py-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refine / Redraft</span>
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose} className="!py-1.5 text-xs">
                  Discard
                </Button>
                <Button type="button" variant="primary" onClick={handleAccept} className="!py-1.5 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Accept &amp; Insert Statement</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
