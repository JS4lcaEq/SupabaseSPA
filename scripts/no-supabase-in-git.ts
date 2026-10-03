import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const names = execSync('git ls-files -co --exclude-standard -z', { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((name) => !name.endsWith('.md') && name !== 'scripts/no-supabase-in-git.ts')

const patterns: { label: string; re: RegExp }[] = [
  { label: 'supabase host', re: /supabase\.co/i },
  { label: 'service role', re: /service_role/i },
  { label: 'jwt', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
]

const hits: string[] = []
for (const name of names) {
  const text = readFileSync(name, 'utf8')
  for (const pattern of patterns) {
    if (pattern.re.test(text)) hits.push(`${name}: ${pattern.label}`)
  }
}

if (hits.length) {
  console.error('Supabase connection must not be committed:')
  for (const hit of hits) console.error(`  ${hit}`)
  process.exit(1)
}

console.log('no supabase connection in git')