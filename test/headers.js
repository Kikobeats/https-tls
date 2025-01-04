'use strict'

const test = require('ava')

const { sortHeaders, getHeader } = require('..')

const { UA } = require('./helpers')

test('.getHeader', t => {
  t.is(getHeader('user-agent', { 'user-agent': 'googlebot' }), 'googlebot')
  t.is(getHeader('user-agent', { 'User-Agent': 'googlebot' }), 'googlebot')
})

test('.sortHeaders', t => {
  t.deepEqual(
    sortHeaders({
      'x-random': 'foo',
      'user-agent': UA.CHROME,
      referer: 'bar',
      accept: 'foo',
      Host: 'foo'
    }),
    {
      Host: 'foo',
      'user-agent': UA.CHROME,
      referer: 'bar',
      accept: 'foo',
      'x-random': 'foo'
    }
  )

  t.deepEqual(
    sortHeaders({
      'x-random': 'foo',
      'user-agent': 'safari',
      referer: 'bar',
      accept: 'foo'
    }),
    {
      accept: 'foo',
      referer: 'bar',
      'user-agent': 'safari',
      'x-random': 'foo'
    }
  )
})
