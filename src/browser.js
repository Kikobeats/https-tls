'use strict'

module.exports = (userAgent = '') => {
  if (!userAgent) return

  let browser
  if (userAgent.includes('Firefox')) {
    browser = 'firefox'
  } else if (userAgent.includes('Chrome')) {
    browser = 'chrome'
  } else {
    browser = 'safari'
  }

  return browser
}
