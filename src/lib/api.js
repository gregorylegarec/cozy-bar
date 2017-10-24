import React, { Component } from 'react'
import { setContent } from './content'
import { getContent } from './reducers'

const upperFirstLetter = val => {
  return val[0].toUpperCase() + val.slice(1)
}
/**
 * Creates a React component that enables to access store
 * properties in a declarative way.
 * 
 * @param  {BarStore} store
 */
const barContentComponent = (store, location) => class extends Component {
  componentDidMount () {
    this.prev = getContent(store.getState(), location)
    this.setContent(this.props.children)
  }

  setContent (content) {
    store.dispatch(setContent(location, content ? React.Children.only(content) : content))
  }

  componentWillUnmount () {
    this.setContent(this.prev)
  }

  componentDidUpdate (prevProps) {
    if (this.props.children !== prevProps.children) {
      this.setContent(this.props.children)
    }
  }

  render () {
    return null
  }
}

/**
 * Creates a public API
 *
 * - getters/setters for public attributes
 * - React components that act as getters/setters
 *
 * @param  {ReduxStore} store - Store on which the API will act
 * @return {object} - Methods of the public API
 */
export default store => {
  const locations = ['left', 'center', 'right']
  const methods = {}
  locations.forEach(location => {
    const upperLoc = upperFirstLetter(location)

    /// expose JS API
    methods[`setBar${upperLoc}`] = value => (
      store.dispatch(setContent(location, value))
    )

    // expose React API
    methods[`Bar${upperLoc}`] = barContentComponent(store, location)
  })
  return methods
}
