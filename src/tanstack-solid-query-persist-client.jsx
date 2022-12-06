// @tanstack/solid-query-persist-client

import { mergeProps, createSignal, onMount, onCleanup } from 'solid-js';
import { persistQueryClient } from "@tanstack/query-persist-client-core"
import { QueryClientProvider, IsRestoringProvider } from '@tanstack/solid-query'

export const PersistQueryClientProvider = (props) => {
  const mergedProps = mergeProps({
    contextSharing: false,
  }, props);

  const [isRestoring, setIsRestoring] = createSignal(true)

  let isStale = false

  const [unsubscribe, restorePromise] = persistQueryClient({
    ...mergedProps.persistOptions,
    queryClient: mergedProps.client,
  })

  restorePromise.then(() => {
    if (!isStale) {
      mergedProps.onSuccess?.()
      setIsRestoring(false)
    }
  })

  onMount(() => mergedProps.client.mount())

  onCleanup(() => {
    mergedProps.client.unmount()

    isStale = true
    unsubscribe()
  })

  return (
    <QueryClientProvider client={mergedProps.client}>
      <IsRestoringProvider value={isRestoring}>
        {mergedProps.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
};
