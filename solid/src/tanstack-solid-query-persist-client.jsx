/*
@tanstack/solid-query-persist-client

TODO contribute to @tanstack/query

based on

QueryClientProvider in
node_modules/@tanstack/solid-query/build/lib/QueryClientProvider.esm.js
node_modules/@tanstack/solid-query/build/solid/QueryClientProvider.jsx

PersistQueryClientProvider in
node_modules/@tanstack/react-query-persist-client/build/lib/PersistQueryClientProvider.esm.js

persistQueryClientSubscribe in
node_modules/@tanstack/query-persist-client-core/build/lib/persist.esm.js
*/

import { createContext, useContext, mergeProps, onMount, onCleanup, createComponent } from 'solid-js';

//import { persistQueryClientSubscribe } from "@tanstack/react-query-persist-client" // no. solid != react
import { persistQueryClientSubscribe } from "@tanstack/query-persist-client-core"

// this took me forever to fix ...
// wrong defaultContext. different than defaultContext in useQueryClient 
//const defaultContext = createContext(undefined); // wrong!
import { defaultContext } from "@tanstack/solid-query"

const QueryClientSharingContext = createContext(false); // If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if Solid Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.

function getQueryClientContext(context, contextSharing) {
  if (context) {
    console.log(`PersistQueryClientProvider getQueryClientContext: context from arg`)
    return context;
  }

  // used by useQueryClient
  // node_modules/@tanstack/solid-query/build/lib/QueryClientProvider.esm.js

  console.log(`PersistQueryClientProvider getQueryClientContext: contextSharing`, contextSharing) // false

  if (contextSharing && typeof window !== 'undefined') {
    if (!window.SolidQueryClientContext) {
      console.log(`PersistQueryClientProvider getQueryClientContext: set window.SolidQueryClientContext`)
      window.SolidQueryClientContext = defaultContext;
    }

    console.log(`PersistQueryClientProvider getQueryClientContext: return window.SolidQueryClientContext`)

    return window.SolidQueryClientContext;
  }

  console.log(`PersistQueryClientProvider getQueryClientContext: return defaultContext`)

  return defaultContext;
}



export const PersistQueryClientProvider = (props) => {
    const mergedProps = mergeProps({
        contextSharing: false,
    }, props);

    let persistQueryClientUnsubscribe

    onMount(() => {
      // same as in non-persisted provider
      console.log('PersistQueryClientProvider.onMount: mount')
      // wrong? mount later? - no.
      mergedProps.client.mount()

      // persistence ...

      // subscribe
      // import { persistQueryClientSubscribe } from "@tanstack/react-query-persist-client"
      console.log('PersistQueryClientProvider.onMount: subscribe')

      // note: different API
      // persistQueryClientSubscribe: props.queryClient
      // QueryClientProvider: props.client
      mergedProps.queryClient = mergedProps.client

      persistQueryClientUnsubscribe =
      persistQueryClientSubscribe(mergedProps)

      // test: mount later
      //mergedProps.client.mount()
    });

    onCleanup(() => {
      // same as in non-persisted provider
      console.log('PersistQueryClientProvider.onCleanup: unmount')
      mergedProps.client.unmount()

      // persistence ...

      console.log('PersistQueryClientProvider.onCleanup: unsubscribe')
      // unsubscribe
      persistQueryClientUnsubscribe()
    })

    const QueryClientContext = getQueryClientContext(mergedProps.context, mergedProps.contextSharing);

    return (
      <QueryClientSharingContext.Provider value={!mergedProps.context && mergedProps.contextSharing}>
        <QueryClientContext.Provider value={mergedProps.client}>
          {mergedProps.children}
        </QueryClientContext.Provider>
      </QueryClientSharingContext.Provider>
    );
};



const PersistQueryClientProvider_ESM = props => {
  const mergedProps = mergeProps({
    contextSharing: false
  }, props);

  let persistQueryClientUnsubscribe

  // onMount is too late??
  // Error: No QueryClient set, use QueryClientProvider to set one
  //onMount(() => {

    // same as in non-persisted provider
    console.log('PersistQueryClientProvider.onMount: mount')
    mergedProps.client.mount()

    // subscribe
    // import { persistQueryClientSubscribe } from "@tanstack/react-query-persist-client"
    console.log('PersistQueryClientProvider.onMount: subscribe')

    // note: different API
    // persistQueryClientSubscribe: props.queryClient
    // QueryClientProvider: props.client
    mergedProps.queryClient = mergedProps.client

    persistQueryClientUnsubscribe =
    persistQueryClientSubscribe(mergedProps)
  //})

  onCleanup(() => {

    // same as in non-persisted provider
    console.log('PersistQueryClientProvider.onCleanup: unmount')
    mergedProps.client.unmount()

    console.log('PersistQueryClientProvider.onCleanup: unsubscribe')
    // unsubscribe
    persistQueryClientUnsubscribe()
  })

  //onMount(() => mergedProps.client.mount());
  //onCleanup(() => mergedProps.client.unmount());

  const QueryClientContext = getQueryClientContext(mergedProps.context, mergedProps.contextSharing);
  return createComponent(QueryClientSharingContext.Provider, {
    get value() {
      return !mergedProps.context && mergedProps.contextSharing;
    },

    get children() {
      return createComponent(QueryClientContext.Provider, {
        get value() {
          return mergedProps.client;
        },

        get children() {
          return mergedProps.children;
        }

      });
    }

  });
};

// export { persistQueryClient, persistQueryClientRestore, persistQueryClientSave, persistQueryClientSubscribe }
// export { removeOldestQuery }
export * from '@tanstack/query-persist-client-core';

//export { PersistQueryClientProvider };
