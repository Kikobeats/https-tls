'use strict'

const test = require('ava')

const { getBrowser } = require('..')

const { UA } = require('./helpers')

test('undefined if user agent is not provided', t => {
  t.is(getBrowser(), undefined)
})

test('safari as fallback', t => {
  t.is(getBrowser('googlebot'), 'safari')
})

test('detect safari', t => {
  t.is(getBrowser(UA.SAFARI), 'safari')
})

test('detect firefox', t => {
  t.is(getBrowser(UA.FIREFOX), 'firefox')
})

test('detect chrome', t => {
  t.is(getBrowser(UA.CHROME), 'chrome')
})
