import { createStore, applyMiddleware } from 'redux'
import appsI18nMiddleware from '../middlewares/appsI18n'
import thunkMiddleware from 'redux-thunk'
import { persistStore, persistCombineReducers } from 'redux-persist'
import { reducers } from '../reducers'
import storage from 'redux-persist/lib/storage'

const config = {
  storage,
  key: 'cozy-bar',
  whitelist: ['locale']
}

const reducer = persistCombineReducers(config, { ...reducers })

const createReduxStore = () => {
  let store = createStore(
    reducer,
    applyMiddleware(appsI18nMiddleware, thunkMiddleware)
  )
  persistStore(store)

  return store
}

export default createReduxStore
