import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Renders the small Markdown subset used for editable copy and policies:
 * "## Heading", "### Sub-heading", "- item", "1. item", **bold**, [text](url), and plain paragraphs.
 * Output is built as React elements, so text is always escaped — no raw HTML is ever injected.
 */

function safeHref(href: string): string | null {
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (/^https:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) return href
  return null
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let i = 0
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>)
    } else {
      const href = safeHref(m[3])
      if (!href) out.push(m[2])
      else if (href.startsWith('/')) out.push(<Link key={key} href={href}>{m[2]}</Link>)
      else out.push(<a key={key} href={href} rel="noopener noreferrer" target={href.startsWith('http') ? '_blank' : undefined}>{m[2]}</a>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let para: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let k = 0

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>)
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      const items = list.items.map((item, idx) => <li key={idx}>{inline(item, `l${k}-${idx}`)}</li>)
      blocks.push(list.ordered ? <ol key={k++}>{items}</ol> : <ul key={k++}>{items}</ul>)
      list = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line === '') {
      flushPara()
      flushList()
      continue
    }
    const h = /^(#{2,3})\s+(.*)$/.exec(line)
    if (h) {
      flushPara()
      flushList()
      blocks.push(h[1].length === 2 ? <h2 key={k++}>{inline(h[2], `h${k}`)}</h2> : <h3 key={k++}>{inline(h[2], `h${k}`)}</h3>)
      continue
    }
    const ul = /^[-*]\s+(.*)$/.exec(line)
    const ol = /^\d+[.)]\s+(.*)$/.exec(line)
    if (ul || ol) {
      flushPara()
      const ordered = Boolean(ol)
      if (list && list.ordered !== ordered) flushList()
      list ??= { ordered, items: [] }
      list.items.push((ul ?? ol)![1])
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()

  return <div className={className ? `prose ${className}` : 'prose'}>{blocks}</div>
}

/** Plain paragraphs only (for short editable blocks). */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  )
}
