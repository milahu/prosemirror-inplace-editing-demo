import { get, set, del } from "idb-keyval";

// import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
/** @typedef {import("@tanstack/react-query-persist-client").PersistedClient} PersistedClient */
/** @typedef {import("@tanstack/react-query-persist-client").Persister} Persister */

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * @see https://tanstack.com/query/v4/docs/plugins/persistQueryClient#building-a-persister
 * @param {IDBValidKey} idbValidKey
 * @return {Persister}
 */
export function createIDBPersister(idbValidKey = "tanstack-query") {
  return {
    persistClient: async (/** @type {PersistedClient} */ client) => {
      //console.log('persistClient persistClient: client', client)
      console.log('persistClient persistClient: client.clientState.queries', client.clientState.queries)

      /*
      // fix storing in DB, but now we get cache miss
      // TODO fix queryKey earlier
      // problem:
      // Proxy objects in queryClient.clientState.queries[i].queryKey
      const queryClient = client
      const queries = queryClient.clientState.queries
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i]
        console.log('persistClient persistClient: queryKey a', query.queryKey)
        // Proxy -> Array
        query.queryKey = [ ...query.queryKey ]
        // Proxy -> Object
        query.queryKey[1] = { ...query.queryKey[1] }
        console.log('persistClient persistClient: queryKey b', query.queryKey)
      }
      */

      set(idbValidKey, client);
    },

    restoreClient: async () => {
      //return await get<PersistedClient>(idbValidKey);
      console.log('🟢 persistClient restoreClient ...')
      console.time('persistClient restoreClient')
      const client = await get(idbValidKey);
      console.timeEnd('persistClient restoreClient')
      console.log('🟢 persistClient restoreClient: client.clientState.queries', client.clientState.queries)
      console.log('persistClient restoreClient: client', client)
      return client;
      //return await get(idbValidKey);
    },

    removeClient: async () => {
      console.log('persistClient removeClient')
      await del(idbValidKey);
    },
  };
}
