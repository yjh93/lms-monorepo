/**
 * React Compiler 적용 전/후 비교: 같은 시나리오의 렌더 횟수와 프로덕션 번들 크기.
 * 사용: pnpm --filter @lms/admin perf:compiler
 */
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const run = (command, compiler) =>
  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env, REACT_COMPILER: compiler ? 'true' : 'false' },
  })

function bundleSize() {
  const dir = 'dist/assets'
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
  const raw = files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0)
  const gzip = files.reduce((sum, f) => sum + gzipSync(readFileSync(join(dir, f))).length, 0)
  return { raw, gzip }
}

const results = {}
for (const compiler of [false, true]) {
  const key = compiler ? 'compiler' : 'baseline'
  run('npx vitest run -c vitest.perf.config.ts', compiler)
  run('npx vite build --logLevel warn', compiler)
  results[key] = {
    render: JSON.parse(readFileSync(`perf-results/render-${key}.json`, 'utf8')),
    bundle: bundleSize(),
  }
}

const { baseline, compiler } = results
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const diff = (a, b) => (a === 0 ? '-' : `${(((b - a) / a) * 100).toFixed(0)}%`)

const lines = [
  '| 컴포넌트 | 적용 전 | 적용 후 | 변화 |',
  '| --- | ---: | ---: | ---: |',
  ...Object.keys(baseline.render.tracked).map((name) => {
    const a = baseline.render.tracked[name]
    const b = compiler.render.tracked[name]
    return `| ${name} | ${a} | ${b} | ${diff(a, b)} |`
  }),
  `| **전체 컴포넌트 렌더** | **${baseline.render.total}** | **${compiler.render.total}** | **${diff(baseline.render.total, compiler.render.total)}** |`,
  '',
  '| 번들(JS 합계) | 적용 전 | 적용 후 | 변화 |',
  '| --- | ---: | ---: | ---: |',
  `| raw | ${kb(baseline.bundle.raw)} | ${kb(compiler.bundle.raw)} | ${diff(baseline.bundle.raw, compiler.bundle.raw)} |`,
  `| gzip | ${kb(baseline.bundle.gzip)} | ${kb(compiler.bundle.gzip)} | ${diff(baseline.bundle.gzip, compiler.bundle.gzip)} |`,
]
process.stdout.write(`\n${lines.join('\n')}\n\n`)
