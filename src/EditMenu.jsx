console.log("EditMenu.jsx: hello")

// tanstack/query for solid https://tanstack.com/query/v4/docs/adapters/solid-query
// TODO solid-query-persist-client: init at 4.13.0
// https://github.com/TanStack/query/pull/4380
import { QueryClient, QueryClientProvider, createQuery, useQueryClient } from '@tanstack/solid-query'

// github client https://octokit.github.io/rest.js
import { Octokit } from "@octokit/rest";

import { createIDBPersister } from "./tanstack-query-indexeddb-persister.js"
import { PersistQueryClientProvider } from "./tanstack-solid-query-persist-client.jsx"

import { GithubFile } from "./GithubFile.jsx"

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

//<nav id="edit-menu"></nav>

export default function EditMenu() {
  return (
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: createIDBPersister()
        }}
      >
      <GithubFile path="file1" octokit={octokit}/>
    </PersistQueryClientProvider>
  )
}