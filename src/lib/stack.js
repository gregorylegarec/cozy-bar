/* eslint-env browser */
/* global __SERVER__ */

import 'babel-polyfill'

import {
  UnavailableStackException,
  UnavailableSettingsException,
  UnauthorizedStackException
} from './exceptions'

// the option credentials:include tells fetch to include the cookies in the
// request even for cross-origin requests
function fetchOptions () {
  return {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${COZY_TOKEN}`
    }
  }
}

let COZY_URL = __SERVER__
let COZY_TOKEN

async function getApps () {
  const res = await fetch(`${COZY_URL}/apps/`, fetchOptions()).catch(e => {
    throw new UnavailableStackException()
  })

  if (res.status === 401) {
    throw new UnauthorizedStackException()
  }

  return (await res.json()).data
}

async function getDiskUsage () {
  const res = await fetch(`${COZY_URL}/settings/disk-usage`, fetchOptions()).catch(e => {
    throw new UnavailableStackException()
  })

  if (res.status === 401) {
    throw new UnauthorizedStackException()
  }

  return parseInt((await res.json()).data.attributes.used, 10)
}

async function getApp (slug) {
  return (await getApps()).find(item => item.attributes.slug === slug)
}

function getIcon (url) {
  return fetch(`${COZY_URL}${url}`, fetchOptions())
  .then(res => res.blob())
  .then(blob => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', event => resolve(event.target.result))
      reader.readAsDataURL(blob)
    })
  })
}

async function hasApp (slug) {
  const app = await getApp(slug)
  return !!(app && app.attributes.state === 'ready')
}

module.exports = {
  init ({cozyURL, token}) {
    COZY_URL = `//${cozyURL}`
    COZY_TOKEN = token
  },
  has: {
    /**
     * has.settings() allow to check if the Settings app is available in the
     * stack or not. It returns a boolean.
     * Exceptionnally, as the Settings app is a critical app (w/o it, no
     * password update, language change, etc), it also throw an exception if
     * the Settings app isn't available.
     */
    async settings () {
      let hasSettings

      try {
        hasSettings = await hasApp('settings')
      } catch (e) {
        hasSettings = false
        throw new UnavailableSettingsException()
      }

      if (!hasSettings) {
        throw new UnavailableSettingsException()
      }

      return hasSettings
    }
  },
  get: {
    app: getApp,
    apps: getApps,
    diskUsage: getDiskUsage,
    icon: getIcon,
    cozyURL () {
      return COZY_URL
    },
    async settingsBaseURI () {
      const settings = await getApp('settings')
      if (!settings) { throw new UnavailableSettingsException() }
      return settings.links.related
    }
  },
  async logout () {
    const options = Object.assign({}, fetchOptions(), {
      method: 'DELETE'
    })

    const res = await fetch(`${COZY_URL}/auth/login`, options).catch(e => {
      throw new UnavailableStackException()
    })

    if (res.status === 401) {
      throw new UnauthorizedStackException()
    } else if (res.status === 204) {
      window.location.reload()
    }
  }
}