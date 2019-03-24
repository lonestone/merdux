import { Reducer } from 'redux'
import {
  IAction,
  IActionsParams,
  IEffect,
  IEffectMap,
  IPreparedStore,
  IStoreCreator,
  IThunkAction,
  IThunkActionsMap
} from './interfaces'

export * from './interfaces'

export const actionPrefix = '@merdux/'

export function createReducer<State>(
  namespace: string,
  initialState: State
): Reducer<State, IAction<State>> {
  return function reducer(state = initialState, action) {
    if (action.type === actionPrefix + namespace) {
      // Transform and return state
      const newPartialState =
        typeof action.transform === 'function'
          ? action.transform(state)
          : action.transform
      if (typeof newPartialState === 'object') {
        return { ...state, ...newPartialState }
      } else {
        return newPartialState
      }
    }
    return state
  }
}

export function createAction<State, Params extends []>(
  namespace: string,
  effect: IEffect<State, Params>
): IThunkAction<State, Params> {
  // Create redux-thunk action
  return (...params) => async (dispatch, getState) => {
    // Run action
    // Set current local state as thisArg
    const transformOrIterator = effect.apply(getState()[namespace], params)

    // Dispatch actions
    if (
      typeof transformOrIterator === 'object' &&
      (transformOrIterator as any).next &&
      (transformOrIterator as any).throw &&
      (transformOrIterator as any).return
    ) {
      // Iterate asynchronously on actions
      for await (const transform of transformOrIterator) {
        dispatch({ type: actionPrefix + namespace, transform })
      }
    } else {
      dispatch({ type: actionPrefix + namespace, transform: transformOrIterator })
    }
  }
}

export function createActions<State, ActionsParams extends IActionsParams>(
  namespace: string,
  effects: IEffectMap<State, ActionsParams>
) {
  // Iterate on each effect
  return Object.keys(effects).reduce<IThunkActionsMap<State, ActionsParams>>(
    (actions, name) => ({
      ...actions,
      // Create action from effect
      [name]: createAction(namespace, effects[name])
    }),
    {} as any
  )
}

export function prepareStore<State, ActionsParams extends IActionsParams>(
  initialState: State,
  effects: IEffectMap<State, ActionsParams>
): IStoreCreator<State, ActionsParams> {
  return (namespace: string) => ({
    initialState,
    actions: createActions(namespace, effects),
    reducer: createReducer(namespace, initialState)
  })
}

export function combineStores<StoresCreators>(storeCreators: StoresCreators) {
  // Iterate on each store creator
  return Object.keys(storeCreators).reduce<IPreparedStore<StoresCreators>>(
    (stores, namespace) => {
      const store = storeCreators[namespace](namespace)
      return {
        initialState: {
          ...stores.initialState,
          [namespace]: store.initialState
        },
        actions: {
          ...stores.actions,
          [namespace]: store.actions
        },
        reducers: {
          ...stores.reducers,
          [namespace]: store.reducer
        }
      }
    },
    {} as any
  )
}