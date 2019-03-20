import React from 'react'
import { Provider } from 'react-redux'
import { StoreContext } from 'redux-react-hook'
import store from '../store'
import Counter from './Counter'
import Counter2 from './Counter2'

export default function App() {
  return (
    <Provider store={store}>
      <StoreContext.Provider value={store}>
        <div className="App">
          <Counter />
          <Counter2 />
        </div>
      </StoreContext.Provider>
    </Provider>
  )
}