export interface MarkdownFormatOptions {
  stripFirstHeading?: boolean
  stripFirstParagraph?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isSafeLink(value: string): boolean {
  return /^(?:https?:\/\/|mailto:|\/|#)/i.test(value)
}

function renderInline(value: string): string {
  const codeTokens: string[] = []
  const tokenised = value.replace(/`([^`\n]+)`/g, (_, code: string) => {
    const token = `@@LLMARKDOWNCODE${codeTokens.length}@@`
    codeTokens.push(`<code>${escapeHtml(code)}</code>`)
    return token
  })

  let output = escapeHtml(tokenised)

  output = output.replace(
    /\[([^\]]+)]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (match, label: string, href: string) => (
      isSafeLink(href)
        ? `<a href="${href}"${/^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
        : match
    ),
  )
  output = output
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')

  codeTokens.forEach((code, index) => {
    output = output.replace(`@@LLMARKDOWNCODE${index}@@`, code)
  })

  return output
}

export function useMarkdown() {
  function formatMarkdown(markdown: string | null | undefined, options: MarkdownFormatOptions = {}): string {
    if (!markdown?.trim()) return ''

    let source = markdown.replace(/\r\n?/g, '\n')
    if (options.stripFirstHeading) {
      source = source.replace(/^\s*#\s+[^\n]+\n?/, '')
    }
    if (options.stripFirstParagraph) {
      const blocks = source.trimStart().split(/\n\s*\n/)
      blocks.shift()
      source = blocks.join('\n\n')
    }

    const lines = source.split('\n')
    const output: string[] = []
    const paragraph: string[] = []
    const listItems: string[] = []
    let listType: 'ul' | 'ol' | null = null
    let codeLanguage = ''
    let codeLines: string[] | null = null

    const flushParagraph = () => {
      if (!paragraph.length) return
      output.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
      paragraph.length = 0
    }

    const flushList = () => {
      if (!listType || !listItems.length) return
      output.push(`<${listType}>${listItems.map(item => `<li>${renderInline(item)}</li>`).join('')}</${listType}>`)
      listItems.length = 0
      listType = null
    }

    for (const line of lines) {
      const fence = line.match(/^\s*```\s*([\w-]*)\s*$/)
      if (fence) {
        if (codeLines) {
          const languageClass = codeLanguage ? ` class="language-${codeLanguage}"` : ''
          output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
          codeLines = null
          codeLanguage = ''
        }
        else {
          flushParagraph()
          flushList()
          codeLines = []
          codeLanguage = fence[1] ?? ''
        }
        continue
      }

      if (codeLines) {
        codeLines.push(line)
        continue
      }

      if (!line.trim()) {
        flushParagraph()
        flushList()
        continue
      }

      const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/)
      if (heading) {
        flushParagraph()
        flushList()
        const level = heading[1]?.length ?? 2
        output.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`)
        continue
      }

      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        flushParagraph()
        flushList()
        output.push('<hr>')
        continue
      }

      const unorderedItem = line.match(/^\s*[-+*]\s+(.+)$/)
      const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/)
      if (unorderedItem || orderedItem) {
        flushParagraph()
        const nextListType = unorderedItem ? 'ul' : 'ol'
        if (listType && listType !== nextListType) flushList()
        listType = nextListType
        listItems.push((unorderedItem?.[1] ?? orderedItem?.[1] ?? '').trim())
        continue
      }

      if (listType && /^\s+\S/.test(line) && listItems.length) {
        listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${line.trim()}`
        continue
      }

      const blockquote = line.match(/^\s*>\s?(.*)$/)
      if (blockquote) {
        flushParagraph()
        flushList()
        output.push(`<blockquote><p>${renderInline(blockquote[1] ?? '')}</p></blockquote>`)
        continue
      }

      flushList()
      paragraph.push(line.trim())
    }

    if (codeLines) {
      const languageClass = codeLanguage ? ` class="language-${codeLanguage}"` : ''
      output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    }
    flushParagraph()
    flushList()

    return output.join('')
  }

  return { formatMarkdown }
}
