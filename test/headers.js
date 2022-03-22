'use strict'

const test = require('ava')

const { getHeader } = require('..')

test('.getHeader', t => {
  t.is(getHeader('user-agent', { 'user-agent': 'googlebot' }), 'googlebot')
  t.is(getHeader('user-agent', { 'User-Agent': 'googlebot' }), 'googlebot')
})
