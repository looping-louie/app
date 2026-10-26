import { readdirSync, readFileSync } from 'node:fs'
import { join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const pagesDirectory = join(projectRoot, 'pages')

describe('Nuxt page route layout', () => {
  it('uses an index page when a route segment has descendants', () => {
    expect(routeFileDirectoryCollisions(pagesDirectory)).toEqual([])
  })

  it('assigns the app layout to every independent app page', () => {
    expect(appPagesWithoutLayout(join(pagesDirectory, '(app)'))).toEqual([])
  })
})

function routeFileDirectoryCollisions(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const directories = new Set(entries.filter(entry => entry.isDirectory()).map(entry => entry.name))
  const collisions = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.vue'))
    .map(entry => parse(entry.name).name)
    .filter(name => directories.has(name))
    .map(name => join(directory, name))
  return [...collisions, ...entries
    .filter(entry => entry.isDirectory())
    .flatMap(entry => routeFileDirectoryCollisions(join(directory, entry.name)))]
}

function appPagesWithoutLayout(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return appPagesWithoutLayout(path)
    if (!entry.isFile() || !entry.name.endsWith('.vue')) return []
    return /layout:\s*['"]app['"]/.test(readFileSync(path, 'utf8')) ? [] : [path]
  })
}
