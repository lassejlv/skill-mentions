import type { CommandInfo, EngineInterface, Register } from 'claude-code'

const MAX_ROWS = 20
const CACHE_MS = 30_000
const MAX_DESC = 70

// First sentence only, cut to one short line.
function brief(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim()
  const sentence = line.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? line
  return sentence.length > MAX_DESC ? `${sentence.slice(0, MAX_DESC - 1).trimEnd()}…` : sentence
}

const MENTION = /(^|\s)\$([A-Za-z0-9_][A-Za-z0-9_:.-]*)/g

let cache: { at: number; skills: CommandInfo[] } | null = null

// Skills and the user's own commands: everything but built-ins and MCP prompts.
async function listSkills($: EngineInterface): Promise<CommandInfo[]> {
  const now = await $.clock.now()
  if (cache === null || now - cache.at > CACHE_MS) {
    const all = await $.command.list()
    cache = { at: now, skills: all.filter(c => c.source === 'plugin' || c.source === 'user') }
  }

  return cache.skills
}

function rank(c: CommandInfo, query: string): number {
  if (query === '') return 0
  const name = c.name.toLowerCase()
  const short = name.includes(':') ? name.slice(name.indexOf(':') + 1) : name
  if (name.startsWith(query) || short.startsWith(query)) return 0
  if (name.includes(query)) return 1
  if (c.description.toLowerCase().includes(query)) return 2

  return -1
}

export const register: Register = on => {
  on('prompt.autocomplete', { token: /^\$/ }, async ($, e, next) => {
    const query = e.token.slice(1).toLowerCase()
    const skills = await listSkills($)
    const rows = skills
      .map(c => ({ c, r: rank(c, query) }))
      .filter(x => x.r >= 0)
      .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name))
      .slice(0, MAX_ROWS)
      .map(({ c }) => ({ text: `$${c.name} `, label: `$${c.name}`, description: brief(c.description) }))

    const { suggestions } = await next(e)

    return { suggestions: [...rows, ...suggestions] }
  })

  // Tell the model which skills the person mentioned, so it loads them.
  on('prompt.submit', async ($, e, next) => {
    if (e.command !== undefined || !e.text.includes('$')) return next(e)

    const skills = await listSkills($)
    const known = new Set(skills.map(c => c.name))
    const named = [...new Set([...e.text.matchAll(MENTION)].map(m => m[2] ?? ''))].filter(n => known.has(n))
    if (named.length === 0) return next(e)

    const note =
      `The user mentioned these skills with $: ${named.join(', ')}. ` +
      'Load each one with the Skill tool before you act on the request.'

    return next({ ...e, context: [...(e.context ?? []), note] })
  }).catch(($, e, next) => next(e))
}
