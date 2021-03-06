import stack from '../stack'
import { ForbiddenException } from '../exceptions'

// constants
const RECEIVE_APP_LIST = 'RECEIVE_APP_LIST'
const RECEIVE_APP_LIST_FORBIDDEN = 'RECEIVE_APP_LIST_FORBIDDEN'
const SET_INFOS = 'SET_INFOS'
const EXCLUDES = ['settings', 'onboarding']
const CATEGORIES = ['cozy', 'partners', 'ptnb']

// selectors
export const getApps = state => state.apps && state.apps.data
export const getAppsFiltered = state => {
  if (!state.apps || !state.apps.data) return []
  return state.apps.data.filter(app =>
    app.name !== state.appName || app.editor !== state.editor
  )
}
export const isAppListForbidden = state => state.apps ? state.apps.forbidden : false
export const getCurrentApp = state => `${state.editor} ${state.appName}`

// actions
const receiveAppList = apps => ({ type: RECEIVE_APP_LIST, apps })
const receiveAppListForbidden = () => ({ type: RECEIVE_APP_LIST_FORBIDDEN })
export const setInfos = (appName, editor) => ({ type: SET_INFOS, appName, editor })

// actions async
export const fetchApps = () => async dispatch => {
  try {
    const rawAppList = await stack.get.apps()
    const apps = rawAppList.filter(app => !EXCLUDES.includes(app.attributes.slug))
    // TODO load only one time icons
    const icons = await Promise.all(apps.map(app => stack.get.icon(app.links.icon)))
    const appsWithIcons = apps.map((app, idx) => ({
      editor: app.attributes.editor,
      name: app.attributes.name,
      slug: app.attributes.slug,
      href: app.links.related,
      category: CATEGORIES.includes(app.attributes.category)
        ? app.attributes.category
        : 'others',
      icon: icons[idx]
        ? {
          src: icons[idx],
          cached: true
        }
        : undefined
    }))
    dispatch(receiveAppList(appsWithIcons))
  } catch (e) {
    if (e.constructor === ForbiddenException) {
      dispatch(receiveAppListForbidden())
    } else {
      console.warn(e.message ? e.message : e)
    }
  }
}

// reducers
const defaultState = {
  apps: { data: null, forbidden: false },
  appName: null,
  editor: null
}

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case RECEIVE_APP_LIST:
      return { ...state, apps: { ...state.apps, data: action.apps, forbidden: false } }
    case RECEIVE_APP_LIST_FORBIDDEN:
      return { ...state, apps: { ...state.apps, forbidden: true } }
    case SET_INFOS:
      return { ...state, appName: action.appName, editor: action.editor }
    default:
      return state
  }
}

export default reducer
