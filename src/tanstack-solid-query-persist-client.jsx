/*

@tanstack/solid-query-persist-client



usage

this is a drop-in replacement for QueryClientProvider from @tanstack/solid-query



based on

QueryClientProvider in
node_modules/@tanstack/solid-query/build/lib/QueryClientProvider.esm.js
node_modules/@tanstack/solid-query/build/solid/QueryClientProvider.jsx

PersistQueryClientProvider in
node_modules/@tanstack/react-query-persist-client/build/lib/PersistQueryClientProvider.esm.js

persistQueryClientSubscribe in
node_modules/@tanstack/query-persist-client-core/build/lib/persist.esm.js

*/



import { createContext, mergeProps, createSignal, onMount, onCleanup } from 'solid-js';

// node_modules/@tanstack/query-persist-client-core/build/lib/persist.esm.js
import { persistQueryClient, persistQueryClientSubscribe, persistQueryClientRestore } from "@tanstack/query-persist-client-core"

import { defaultContext, IsRestoringProvider, IsRestoringContext } from "@tanstack/solid-query"



// TODO?
// export { persistQueryClient, persistQueryClientRestore, persistQueryClientSave, persistQueryClientSubscribe }
// export { removeOldestQuery }
//export * from '@tanstack/query-persist-client-core';



const QueryClientSharingContext = createContext(false); // If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if Solid Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.




function getQueryClientContext(context, contextSharing) {
  if (context) {
    return context;
  }

  if (contextSharing && typeof window !== 'undefined') {
    if (!window.SolidQueryClientContext) {
      window.SolidQueryClientContext = defaultContext;
    }

    return window.SolidQueryClientContext;
  }

  return defaultContext;
}



export const PersistQueryClientProvider = (props) => {
    const mergedProps = mergeProps({
        contextSharing: false,
    }, props);

    //let unsubscribe

    //const [isRestoring, setIsRestoring] = React.useState(true)
    const [isRestoring, setIsRestoring] = createSignal(true) // closest to react version
    //const [isRestoring, setIsRestoring] = useIsRestoring(); setIsRestoring(true)

    let isStale = false

    //onMount(() => {
      // same as in non-persisted provider
      console.log('PersistQueryClientProvider.onMount: mount')
      mergedProps.client.mount()
      // TODO mount later?

      // persistence ...

      // note: different API
      // persistQueryClientSubscribe: props.queryClient
      // QueryClientProvider: props.client
      // sync API prop names: rename client to queryClient
      // https://github.com/TanStack/query/discussions/4365
      mergedProps.queryClient = mergedProps.client

      const [unsubscribe, restorePromise] = persistQueryClient(mergedProps)

      restorePromise.then(() => {
        console.log('tanstack-solid-query-persist-client.jsx restorePromise done')
        if (!isStale) {
          mergedProps.onSuccess?.() // TODO remove? only in react?
          console.log('tanstack-solid-query-persist-client.jsx restorePromise done: setIsRestoring(false)')
          setIsRestoring(false)
        }
      })

      // restore old queries
      //persistQueryClientRestore(mergedProps)

      // subscribe
      //console.log('PersistQueryClientProvider: subscribe')
      //unsubscribe =
      //persistQueryClientSubscribe(mergedProps)

      // test: mount later
      //console.log('PersistQueryClientProvider: mount')
      //mergedProps.client.mount()
    //});

    onCleanup(() => {
      // same as in non-persisted provider
      //console.log('PersistQueryClientProvider.onCleanup: unmount')
      mergedProps.client.unmount()

      // persistence ...
      isStale = true

      //console.log('PersistQueryClientProvider.onCleanup: unsubscribe')
      // unsubscribe
      unsubscribe()
    })

    const QueryClientContext = getQueryClientContext(mergedProps.context, mergedProps.contextSharing);

/*
IsRestoringProvider
https://github.com/TanStack/query/blob/main/packages/react-query-persist-client/src/PersistQueryClientProvider.tsx

not reactive
          <IsRestoringContext.Provider value={isRestoring()}>
          <IsRestoringContext.Provider value={() => isRestoring()}>

*/

    return (
      <QueryClientSharingContext.Provider value={!mergedProps.context && mergedProps.contextSharing}>
        <QueryClientContext.Provider value={mergedProps.client}>
          <IsRestoringContext.Provider value={isRestoring}>
            {mergedProps.children}
          </IsRestoringContext.Provider>
        </QueryClientContext.Provider>
      </QueryClientSharingContext.Provider>
    );
};
