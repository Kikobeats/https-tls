'use strict'

const test = require('ava')

const { getBrowser } = require('..')

test('undefined if user agent is not provided', t => {
  t.is(getBrowser(), undefined)
})

test('safari as fallback', t => {
  t.is(getBrowser('googlebot'), 'safari')
})
