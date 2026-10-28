'use strict'

const { execFileSync } = require('child_process')
const test = require('ava').default
const path = require('path')

const pkg = require('../package.json')

const INSTALL_LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall']

const packedFiles = () => {
  const [{ files }] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    })
  )
  return files.map(file => file.path)
}

test('installing runs no scripts', t => {
  const installScripts = INSTALL_LIFECYCLE_SCRIPTS.filter(
    name => name in pkg.scripts
  )
  t.deepEqual(installScripts, [])
})

test('the published package ships the headers order data and no release scripts', t => {
  const files = packedFiles()
  t.true(files.includes('src/headers-order.json'))
  t.false(files.some(file => file.startsWith('scripts/')))
})
