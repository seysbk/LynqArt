import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { MarkdownTips } from '../../components/ui/MarkdownTips'
import { Button } from '../../components/ui/Button'
import { QrCode, Download, Eye, Check, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const empty = {
  title: '',
  short_description: '',
  markdown_description: '',
  location: '',
  start_date: '',
  end_date: '',
  status: 'draft',
  show_on_homepage: false,
  is_featured: false,
}

const inputClass =
  'w-full rounded-[9px] border border-white/[0.09] bg-[#0D0F14] px-3.5 py-2.5 text-xs text-[#F4F4F5] outline-none transition focus:border-indigo-400 placeholder:text-[#71717A]'

const errorText = (error) =>
  Object.values(error?.response?.data || {})
    .flat()
    .join(' ') || 'Could not save exhibition.'

export function ExhibitionManagerPage() {
  const { exhibitionSlug } = useParams()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState(empty)
  const [item, setItem] = useState(null)
  const [allArtworks, setAllArtworks] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const loadAllArtworks = () =>
    api
      .get('/artworks/', { params: { ordering: 'title' } })
      .then(({ data }) => setAllArtworks(data.results || data || []))

  const refresh = async (slug) => {
    const { data } = await api.get(`/exhibitions/${slug}/`)
    setItem(data)
    setForm({ ...empty, ...data })

    const qr = await api
      .get('/qr/codes/', { params: { entity_type: 'exhibition', entity_id: data.id } })
      .catch(() => ({ data: [] }))
    setQrCode((qr.data.results || qr.data || [])[0] || null)
  }

  useEffect(() => {
    loadAllArtworks()
    if (exhibitionSlug) refresh(exhibitionSlug).catch(() => setMessage('Could not load exhibition.'))
  }, [exhibitionSlug])

  const change = (event) =>
    setForm({
      ...form,
      [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    })

  const handleMarkdownInsert = (prefix, suffix, placeholder) => {
    const current = form.markdown_description || ''
    const addition = `${prefix}${placeholder}${suffix}`
    setForm({ ...form, markdown_description: current + addition })
  }

  const saveExhibitionData = async (nextStep = null) => {
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      const { data } = item
        ? await api.patch(`/exhibitions/${item.slug}/`, payload)
        : await api.post('/exhibitions/', payload)

      // Auto-generate QR if not present
      let currentQr = qrCode
      if (!currentQr) {
        try {
          const qrRes = await api.post('/qr/codes/generate_qr/', { entity_type: 'exhibition', entity_id: data.id })
          currentQr = qrRes.data
          setQrCode(currentQr)
        } catch {
          // Ignore QR creation error
        }
      }

      await refresh(data.slug)
      setMessage('Exhibition saved successfully!')

      if (!exhibitionSlug) {
        navigate(`/dashboard/exhibitions/${data.slug}/edit`, { replace: true })
      }

      if (nextStep) {
        setActiveStep(nextStep)
      }
      return data
    } catch (error) {
      setMessage(errorText(error))
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleStepSubmit = async (e, targetStep) => {
    e.preventDefault()
    await saveExhibitionData(targetStep)
  }

  const uploadBanner = async (file) => {
    if (!file || !item) return
    const payload = new FormData()
    payload.append('banner', file)
    try {
      await api.post(`/exhibitions/${item.slug}/upload_banner/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await refresh(item.slug)
      setMessage('Banner image uploaded!')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const deleteBanner = async () => {
    if (!item) return
    try {
      await api.delete(`/exhibitions/${item.slug}/upload_banner/`)
      await refresh(item.slug)
      setMessage('Banner image removed.')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const generateQr = async () => {
    if (!item) return
    try {
      const { data } = await api.post('/qr/codes/generate_qr/', { entity_type: 'exhibition', entity_id: item.id })
      setQrCode(data)
      setMessage('Exhibition QR generated!')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  const linkedArtworkIds = new Set((item?.artworks || []).map((link) => link.artwork || link.artwork_detail?.id))

  const toggleArtworkLink = async (artworkId) => {
    if (!item) return
    try {
      const existingLink = (item.artworks || []).find(
        (link) => link.artwork === artworkId || link.artwork_detail?.id === artworkId,
      )
      if (existingLink) {
        await api.delete(`/exhibitions/artworks/${existingLink.id}/`)
        setMessage('Artwork unlinked.')
      } else {
        await api.post('/exhibitions/artworks/', { exhibition: item.id, artwork: artworkId })
        setMessage('Artwork linked!')
      }
      await refresh(item.slug)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Organizer Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F4F5]">
            {item ? `Edit Exhibition: ${item.title}` : 'Create Exhibition'}
          </h1>
        </div>

        {item && (
          <Link to={`/exhibitions/${item.slug}`} target="_blank">
            <Button variant="secondary" className="!py-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Catalogue</span>
            </Button>
          </Link>
        )}
      </div>

      {message && (
        <div className="rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
          {message}
        </div>
      )}

      {/* Multi-Part Stepper Navigation */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0D0F14] rounded-[12px] border border-white/[0.08] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 1
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
          <span>Part 1: Primary Specs &amp; QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 2
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
          <span>Part 2: Description &amp; Banner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`py-3 px-2 rounded-[9px] flex flex-col sm:flex-row items-center justify-center gap-2 transition ${
            activeStep === 3
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
          <span>Part 3: Catalogue Artworks</span>
        </button>
      </div>

      {/* PART 1: PRIMARY SPECS & ENTRANCE QR */}
      {activeStep === 1 && (
        <form onSubmit={(e) => handleStepSubmit(e, 2)} className="surface-card p-6 space-y-6">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-base font-bold text-[#F4F4F5]">Part 1: Exhibition Details</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Enter primary exhibition venue and schedule details. Saving will generate the entrance QR tag.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Exhibition Title *
              <input required name="title" value={form.title || ''} onChange={change} placeholder="Faculty Showcase 2026" className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Location / Gallery *
              <input required name="location" value={form.location || ''} onChange={change} placeholder="Building 4 Gallery" className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              Start Date
              <input type="date" name="start_date" value={form.start_date || ''} onChange={change} className={inputClass} />
            </label>

            <label className="space-y-1 text-xs font-medium text-[#A1A1AA]">
              End Date
              <input type="date" name="end_date" value={form.end_date || ''} onChange={change} className={inputClass} />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-medium text-[#A1A1AA]">
            Short Synopsis
            <input name="short_description" value={form.short_description || ''} onChange={change} placeholder="Brief summary of showcase..." className={inputClass} />
          </label>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#A1A1AA]">Publication Status</label>
            <select name="status" value={form.status} onChange={change} className={inputClass}>
              <option value="draft">Draft (Private - Hidden from public)</option>
              <option value="published">Published (Public)</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Exhibition Entrance QR Code */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span>Exhibition Entrance QR Tag</span>
            </h3>

            {qrCode?.qr_image_url ? (
              <div className="flex items-center gap-4 bg-[#0D0F14] p-3.5 rounded-[10px] border border-white/[0.08]">
                <img src={mediaUrl(qrCode.qr_image_url)} alt="QR" className="h-20 w-20 bg-white p-1 rounded shrink-0" />
                <div className="space-y-1 text-xs">
                  <p className="font-mono text-[#F4F4F5] font-semibold">{qrCode.qr_slug}</p>
                  <p className="text-[11px] text-[#71717A]">Scans recorded: {qrCode.scans || 0}</p>
                  <a href={`${api.defaults.baseURL}/qr/codes/${qrCode.id}/download/`}>
                    <Button type="button" variant="primary" className="!py-1 !px-2.5 text-[11px] mt-1">
                      <Download className="h-3 w-3" />
                      <span>Download QR Image</span>
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] text-xs text-[#71717A] flex items-center justify-between flex-wrap gap-2">
                <span>Clicking <strong>"Save &amp; Continue"</strong> will save exhibition details and generate the Entrance QR Tag.</span>
                {item && (
                  <Button type="button" variant="primary" onClick={generateQr} className="!py-1 !px-2.5 text-xs">
                    Generate QR Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="submit" variant="primary" disabled={saving} className="text-xs">
              <span>{saving ? 'Saving Specs...' : 'Save Details & Continue to Description'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PART 2: CURATOR DESCRIPTION & BANNER */}
      {activeStep === 2 && (
        <form onSubmit={(e) => handleStepSubmit(e, 3)} className="surface-card p-6 space-y-6">
          <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[#F4F4F5]">Part 2: Curator Description &amp; Banner</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Write a detailed curator introduction in Markdown and upload a banner graphic.
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={() => setPreview(!preview)} className="!py-1.5 !px-3 text-xs">
              <Eye className="h-4 w-4" />
              <span>{preview ? 'Editor' : 'Preview'}</span>
            </Button>
          </div>

          {!preview && <MarkdownTips onInsert={handleMarkdownInsert} value={form.markdown_description} />}

          {preview ? (
            <div className="surface-card p-4 min-h-[160px] prose prose-invert max-w-none text-xs text-[#F4F4F5]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.markdown_description || '*No curator description written.*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              name="markdown_description"
              rows={6}
              value={form.markdown_description || ''}
              onChange={change}
              placeholder="Write curator introduction in Markdown..."
              className={`${inputClass} font-mono text-xs`}
            />
          )}

          {/* Banner Graphic Upload */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#F4F4F5]">Exhibition Banner Image</h3>
              {item?.banner_image && (
                <Button type="button" variant="secondary" onClick={deleteBanner} className="!py-1 !px-2.5 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10">
                  Remove Banner
                </Button>
              )}
            </div>
            <ImageUpload label="Upload Banner Graphic" onChange={uploadBanner} />
            {item?.banner_image && (
              <img src={mediaUrl(item.banner_image)} alt="Banner" className="h-28 w-full object-cover rounded-[9px]" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-white/[0.06] text-xs text-[#A1A1AA]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="show_on_homepage" checked={form.show_on_homepage} onChange={change} className="rounded border-white/[0.09] text-indigo-600" />
              <span>Show on Homepage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={change} className="rounded border-white/[0.09] text-indigo-600" />
              <span>Featured Exhibition Badge</span>
            </label>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
            <Button type="button" variant="secondary" onClick={() => setActiveStep(1)} className="text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Part 1</span>
            </Button>

            <Button type="submit" variant="primary" disabled={saving} className="text-xs">
              <span>{saving ? 'Saving Description...' : 'Save Description & Continue to Artworks'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PART 3: CATALOGUE ARTWORKS */}
      {activeStep === 3 && (
        <form onSubmit={(e) => handleStepSubmit(e, null)} className="surface-card p-6 space-y-6">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-base font-bold text-[#F4F4F5]">Part 3: Link Catalogue Artworks</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Select artworks to feature in this exhibition's digital catalogue.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#F4F4F5]">Catalogue Artworks ({item?.artworks?.length || 0} Linked)</h3>
            <div className="grid gap-2 sm:grid-cols-3 pt-1">
              {allArtworks.map((artwork) => {
                const isLinked = linkedArtworkIds.has(artwork.id)
                return (
                  <div
                    key={artwork.id}
                    onClick={() => toggleArtworkLink(artwork.id)}
                    className={`p-3 rounded-[9px] border text-xs cursor-pointer flex items-center justify-between transition ${
                      isLinked ? 'bg-indigo-600/20 border-indigo-400/50 text-[#F4F4F5]' : 'bg-[#0D0F14] border-white/[0.06] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="truncate">{artwork.title}</span>
                    <span className="text-[10px] font-bold shrink-0 ml-2">{isLinked ? '✓ Linked' : '+ Link'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-white/[0.06]">
            <Button type="button" variant="secondary" onClick={() => setActiveStep(2)} className="text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Part 2</span>
            </Button>

            <Button type="submit" variant="primary" disabled={saving} className="text-xs">
              <Check className="h-4 w-4" />
              <span>{saving ? 'Finalizing...' : 'Save & Complete Exhibition'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}