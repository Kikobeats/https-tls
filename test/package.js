'use strict'

const { execFileSync } = require('child_process')
const test = require('ava').default
const path = require('path')

const pkg = require('../package.json')

const INSTALL_LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall']

const packedFiles = () => {
  const [{ files }] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    })
  )
  return files.map(file => file.path)
}

test('install refreshes header order and falls back to the bundled file', t => {
  const installScripts = INSTALL_LIFECYCLE_SCRIPTS.filter(
    name => name in pkg.scripts
  )
  t.deepEqual(installScripts, ['postinstall'])
  t.is(pkg.scripts.postinstall, 'node scripts/postinstall.js')
})

test('the published package ships the headers order and the install script', t => {
  const files = packedFiles()
  t.true(files.includes('src/headers-order.json'))
  t.true(files.includes('scripts/postinstall.js'))
  t.true(files.includes('scripts/update-headers-order.js'))
})

test('release refreshes header order before testing and stages it only after a successful update', t => {
  t.is(
    pkg.scripts.prerelease,
    'npm run contributors && npm run update:headers-order && npm test'
  )
  t.is(
    pkg.scripts['update:headers-order'],
    'node scripts/update-headers-order.js && git add src/headers-order.json'
  )
})
