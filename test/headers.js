'use strict'

const test = require('ava')

const { sortHeaders, getHeader } = require('..')

test('.getHeader', t => {
  t.is(getHeader('user-agent', { 'user-agent': 'googlebot' }), 'googlebot')
  t.is(getHeader('user-agent', { 'User-Agent': 'googlebot' }), 'googlebot')
})

test('.sortHeaders', t => {
  t.deepEqual(
    sortHeaders({ 'user-agent': undefined, referer: 'bar', accept: 'foo' }),
    {
      'user-agent': undefined,
      referer: 'bar',
      accept: 'foo'
    }
  )

  t.deepEqual(
    sortHeaders({ 'user-agent': 'safari', referer: 'bar', accept: 'foo' }),
    {
      accept: 'foo',
      referer: 'bar',
      'user-agent': 'safari'
    }
  )
})
