import { QueryClient, QueryClientProvider, createQuery, useQueryClient } from '@tanstack/solid-query'

export function GithubFile(props) {

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
      return props.octokit.rest.repos.getContent(params)
      //return octokit.rest.repos.getCommit(params)
      //return octokit.rest.git.getBlob(params)
      //return octokit.rest.pulls.get(params)
    },
    {
      // never refetch. we are fetching immutable data
      // (at least when fetching files by their commit hash, or by their blob hash)

      // any previous data will be kept when fetching new data because the query key changed.
      // example: this Query is part of a paginated component
      //keepPreviousData: true,
      // guess: this will set query.state.dataUpdatedAt ?

      //retryOnMount: true,

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
      //refetchOnWindowFocus: true, // default true!
   
      // @tanstack/query-core/build/lib/queryObserver.esm.js
      // function shouldFetchOnMount(query, options) {
      //   return shouldLoadOnMount(query, options) || query.state.dataUpdatedAt > 0 && shouldFetchOn(query, options, options.refetchOnMount);
      // }
      //refetchOnMount: false,
      refetchOnMount: true,

      //refetchOnReconnect: false,
      refetchOnReconnect: true,
    }
  )

  return (
    <div>
      <h3>Main</h3>
      <div>
        <Switch>
          <Match when={query.status === 'loading'}>Loading...</Match>
          <Match when={query.error instanceof Error}>
            <span>Error: {query.error.message}</span>
          </Match>
          <Match when={query.data !== undefined}>
            <>
              <pre>{JSON.stringify(query.data, null, 2)}</pre>
              <div>{query.isFetching ? 'Background Updating...' : ' '}</div>
            </>
          </Match>
          <Match when={true}>query.data is undefined</Match>
        </Switch>
      </div>
    </div>
  )
}
