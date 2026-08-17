import React, { useState } from 'react'
import { Icon } from './Icons'

export function MarkdownTips({ onInsert, value = '' }) {
  const [showTips, setShowTips] = useState(false)

  const handleAction = (type) => {
    if (!onInsert) return
    let prefix = ''
    let suffix = ''
    let placeholder = 'text'

    switch (type) {
      case 'bold':
        prefix = '**'
        suffix = '**'
        placeholder = 'bold text'
        break
      case 'italic':
        prefix = '*'
        suffix = '*'
        placeholder = 'italic text'
        break
      case 'h2':
        prefix = '\n## '
        suffix = '\n'
        placeholder = 'Section Heading'
        break
      case 'h3':
        prefix = '\n### '
        suffix = '\n'
        placeholder = 'Subheading'
        break
      case 'quote':
        prefix = '\n> '
        suffix = '\n'
        placeholder = 'Artist statement quote or inspiration'
        break
      case 'list':
        prefix = '\n- '
        suffix = '\n- Item 2\n- Item 3\n'
        placeholder = 'First list item'
        break
      case 'link':
        prefix = '['
        suffix = '](https://example.com)'
        placeholder = 'Link label'
        break
      case 'code':
        prefix = '`'
        suffix = '`'
        placeholder = 'term'
        break
      default:
        break
    }
    onInsert(prefix, suffix, placeholder)
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/80 p-3 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Format:</span>
          
          <button
            type="button"
            onClick={() => handleAction('bold')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Bold (**text**)"
          >
            <Icon name="bold" className="h-3.5 w-3.5" />
            <span>Bold</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('italic')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Italic (*text*)"
          >
            <Icon name="italic" className="h-3.5 w-3.5" />
            <span>Italic</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('h2')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Heading 2 (## Title)"
          >
            <Icon name="heading" className="h-3.5 w-3.5" />
            <span>H2</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('h3')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Heading 3 (### Subtitle)"
          >
            <span className="text-[11px] font-bold">H3</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('quote')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Blockquote (> quote)"
          >
            <Icon name="quote" className="h-3.5 w-3.5" />
            <span>Quote</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('list')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Bullet List (- item)"
          >
            <Icon name="list" className="h-3.5 w-3.5" />
            <span>List</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('link')}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-indigo-300"
            title="Link ([title](url))"
          >
            <Icon name="link" className="h-3.5 w-3.5" />
            <span>Link</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
            showTips
              ? 'bg-indigo-600 text-white'
              : 'border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
          }`}
        >
          <Icon name="sparkles" className="h-3.5 w-3.5 text-indigo-400" />
          <span>{showTips ? 'Hide Markdown Guide' : 'Markdown Formatting Tips'}</span>
        </button>
      </div>

      {showTips && (
        <div className="mt-3 grid gap-4 border-t border-slate-800/60 pt-3 text-xs text-slate-300 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Icon name="badgeCheck" className="h-4 w-4 text-indigo-400" />
              Artist Statement Writing Tips
            </p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Use <code className="text-amber-300 bg-slate-900 px-1 rounded">## Concept</code> to introduce core thematic motivations.</li>
              <li>Emphasize key materials or processes with <code className="text-amber-300 bg-slate-900 px-1 rounded">**oil on linen**</code>.</li>
              <li>Include exhibition provenance or curators notes inside blockquotes: <code className="text-amber-300 bg-slate-900 px-1 rounded">&gt; Quote...</code></li>
              <li>Link external archives or press coverage: <code className="text-amber-300 bg-slate-900 px-1 rounded">[Review](url)</code>.</li>
            </ul>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Icon name="code" className="h-4 w-4 text-indigo-400" />
              Markdown Quick Cheat Sheet
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div className="text-slate-400"><code className="text-indigo-300"># Title</code> &rarr; H1 Header</div>
              <div className="text-slate-400"><code className="text-indigo-300">## Section</code> &rarr; H2 Header</div>
              <div className="text-slate-400"><code className="text-indigo-300">**bold**</code> &rarr; <strong>Bold</strong></div>
              <div className="text-slate-400"><code className="text-indigo-300">*italic*</code> &rarr; <em>Italic</em></div>
              <div className="text-slate-400"><code className="text-indigo-300">- Item</code> &rarr; Bullet Point</div>
              <div className="text-slate-400"><code className="text-indigo-300">&gt; Text</code> &rarr; Blockquote</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
