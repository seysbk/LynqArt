import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function normalizeMarkdown(value) {
  if (typeof value !== 'string') return ''

  let markdown = value
  try {
    const parsed = JSON.parse(markdown)
    if (typeof parsed === 'string') markdown = parsed
  } catch {
    // The value is ordinary markdown rather than a JSON-encoded string.
  }

  return markdown
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
}

export function MarkdownContent({ children, ...props }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} {...props}>
      {normalizeMarkdown(children)}
    </ReactMarkdown>
  )
}
