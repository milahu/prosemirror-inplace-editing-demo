import logo from './logo.svg';
import styles from './App.module.css';

import { onMount, onCleanup } from "solid-js";

// tanstack/query for solid https://tanstack.com/query/v4/docs/adapters/solid-query
import { QueryClient, QueryClientProvider, createQuery, useQueryClient } from '@tanstack/solid-query'

// github client https://octokit.github.io/rest.js
import { Octokit } from "@octokit/rest";

import { createIDBPersister } from "./tanstack-query-indexeddb-persister.js"
import { PersistQueryClientProvider } from "./tanstack-solid-query-persist-client.jsx"

const queryClient = new QueryClient()

const octokit = new Octokit({
  // read access to contents of https://github.com/milahu/prosemirror-inplace-editing-demo-test-repo
  // expires 2023-10-24
  // must escape token to fix: Your GitHub Personal Access Token has been revoked
  auth: (
    "gith" +
    "ub_p" +
    "at_" +
    "11AD" +
    "C3YXY0JNCQB" +
    "bvqukhc_VAYx" +
    "GiSpKsCYsiE2vy" +
    "zOR1iVYYmVkPEB" +
    "707abTxLywAS22" +
    "REUDVgkOBJp83"
  ),
  userAgent: 'milahu/prosemirror-inplace-editing-demo 0.0.0',
})

function App() {
  const persister = createIDBPersister()
  return (
    <PersistQueryClientProvider
        client={queryClient}
        persister={persister}
      >
      <div>
        goal: the "x-ratelimit-used" numbers should stay constant across page reloads.
        this means that the cache is used = no refetching is done
      </div>
      <GithubFile path="file1"/>
      <GithubFile path="file2"/>
    </PersistQueryClientProvider>
  )
}

function GithubFile(props) {

  let queryClient
  onMount(() => {
    queryClient = useQueryClient()
  })


  const params = {
    // https://github.com/milahu/prosemirror-inplace-editing-demo-test-repo
    owner: "milahu",
    repo: "prosemirror-inplace-editing-demo-test-repo",

    // getBlob
    // git hash-object markdown/test-versions.md
    //file_sha: "64fc1f02dca9c3e2dc02cff076566ab300f0c0a2",

    // getContent
    //path: "markdown/test-versions.md",
    path: props.path,
  }

  // https://tanstack.com/query/v4/docs/guides/caching

  const queryKey = ['octokit.rest.repos.getContent', params]
  console.log('GithubFile: createQuery')
  const query = createQuery(
    () => queryKey,
    // note: we must serialize this for indexeddb, so cannot be solidjs proxy
    // fixed in patch:
    // patches/@tanstack+solid-query+4.13.0.patch
    (args) => {
      // note: args != params
      const params = args.queryKey[1]
      console.log(`GithubFile: useQuery: fetching ${queryKey}`, args)
      // https://docs.github.com/en/rest/repos/contents
      return octokit.rest.repos.getContent(params)
      //return octokit.rest.repos.getCommit(params)
      //return octokit.rest.git.getBlob(params)
      //return octokit.rest.pulls.get(params)
    },
    {
      // never refetch. we are fetching immutable data
      // (at least when fetching files by their commit hash, or by their blob hash)

      // any previous data will be kept when fetching new data because the query key changed.
      // example: this Query is part of a paginated component
      keepPreviousData: true,

      // Defaults to 5 * 60 * 1000 (5 minutes) or Infinity during SSR
      // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different cache times are specified, the longest one will be used.
      // If set to Infinity, will disable garbage collection
      cacheTime: Infinity,

      // The time in milliseconds after data is considered stale. This value only applies to the hook it is defined on.
      // If set to Infinity, the data will never be considered stale
      //staleTime: 0,
      staleTime: Infinity,

      // FIXME? this should not override "cacheTime: Infinity"
      // also, components should not re-render on window focus.
      // https://github.com/TanStack/query/pull/71
      // @tanstack/query-core/build/lib/query.esm.js
      // const observer = this.observers.find(x => x.shouldFetchOnWindowFocus());
      // @tanstack/query-core/build/lib/queryObserver.esm.js
      // shouldFetchOnWindowFocus() {
      //   return shouldFetchOn(this.currentQuery, this.options, this.options.refetchOnWindowFocus);
      // }
      refetchOnWindowFocus: false,
   
      // @tanstack/query-core/build/lib/queryObserver.esm.js
      // function shouldFetchOnMount(query, options) {
      //   return shouldLoadOnMount(query, options) || query.state.dataUpdatedAt > 0 && shouldFetchOn(query, options, options.refetchOnMount);
      // }
      refetchOnMount: false,

      refetchOnReconnect: false,
    }
  )

  return (
    <div>
      <h3>GithubFile</h3>
      <div>
        <Switch>
          <Match when={query.status === 'loading'}>Loading...</Match>
          <Match when={query.error instanceof Error}>
            <span>Error: {query.error.message}</span>
          </Match>
          <Match when={query.data !== undefined}>
            <>
              <div>
                <h4>x-ratelimit-used {(query.data.headers['x-ratelimit-used'])}</h4>
                <details>
                  <pre>{JSON.stringify(query.data, null, 2)}</pre>
                </details>
                {/*
                <For each={query.data}>
                  {(post) => (
                    <p>
                      <a
                        onClick={() => props.setPostId(post.id)}
                        href="#"
                        style={
                          // We can access the query data here to show bold links for
                          // ones that are cached
                          queryClient.getQueryData(['post', post.id])
                            ? {
                                'font-weight': 'bold',
                                color: 'green',
                              }
                            : {}
                        }
                      >
                        {post.title}
                      </a>
                    </p>
                  )}
                </For>
                */}
              </div>
              <div>{query.isFetching ? 'Background Updating...' : ' '}</div>
            </>
          </Match>
        </Switch>
      </div>
    </div>
  )
}

export default App;
