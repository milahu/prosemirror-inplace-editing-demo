# prosemirror track changes demo

demo: how to add a "track changes" feature to prosemirror


## related

* https://github.com/fiduswriter/fiduswriter/issues/1142
* https://github.com/newsdev/prosemirror-change-tracking-prototype/pull/2

---

https://github.com/ProseMirror/prosemirror/issues/9
export/import from git
It would be really interesting to "save" to git and "load" from git (Markdown).

---

https://discuss.prosemirror.net/t/offline-peer-to-peer-collaborative-editing-using-yjs/2488

https://github.com/yjs/y-prosemirror

> based off http://y-js.org/, you also need a database adapter for persistence while offline. Indexeddb is one way to do that

> Editor bindings, like y-prosemirror, y-codemirror, or y-quill make a specific editor collaborative. Connectors, like y-webrtc, or y-websocket handle how to sync to other peers. And Persistence adapters handle how to persist data to a database to make it available offline (e.g. y-indexeddb for the browser, or y-leveldb for the server).

---

https://github.com/yjs/y-prosemirror/issues/114

import { Collaboration } from '@tiptap/extension-collaboration'
import { ySyncPlugin, yUndoPlugin, yUndoPluginKey } from 'y-prosemirror'

---

https://docs.yjs.dev/ecosystem/editor-bindings/prosemirror

---

https://docs.yjs.dev/ecosystem/database-provider/y-indexeddb - docs website is broken? fails to load for me ...

https://github.com/search?q=IndexeddbPersistence+y-prosemirror&type=code

https://github.com/pamphlets/editorial/blob/master/index.js

https://github.com/RobinJadoul/nuboard/blob/master/src/components/Editor.svelte

https://github.com/nandit123/crdt-text-editor-2/blob/main/prosemirror-versions.js

https://github.com/FleekHQ/crdt-text-editor/blob/develop/prosemirror-versions.js

---

TODO yjs github storage backend

---

yjs matrix backend

https://github.com/YousefED/Matrix-CRDT

https://discuss.prosemirror.net/t/offline-peer-to-peer-collaborative-editing-using-yjs/2488/28

--

fileystem backend

https://motif.land/blog/syncing-text-files-using-yjs-and-the-file-system-access-api

> To make this data available instantly and while offline, browser storage, such as IndexedDB, can be used. In Motif, we use Replicache to sync local and remote states.

> But while the client apps, the cloud storage, and the local IndexedDB storage can hold the Yjs documents as CRDTs in their entirety, which is required for merging changes, the files on disk only hold their textual representations. With files, we lose the CRDT info, and thereby, the built-in merge capabilities.
>
> Of course, we are not satisfied with a solution that simply overwrites changes. Not only do we risk losing data, e.g. if a change comes in from the file system and from a remote client at the same time, but it would also push us to add an extra layer of complexity in order to figure out what version comes in last (timestamps are hard to deal with in a distributed setup).
>
> The solution that we present here turns out to be fairly straightforward, by simply adopting a “CRDT mindset” when thinking about the problem. If we can somehow manage to make the disk files behave as if they were CRDTs as well, we can then treat the file system as just another data source in our CRDT architecture, providing nothing but delta updates. As illustrated below, this can be achieved by keeping a version of the “last-write-to-disk” in a persistent cache, and computing the diff with the disk version as it comes in.

---

https://replicache.dev/ - decentral apps

https://replicache.dev/#how

> Replicache data is divided into spaces up to 64MB in size. When a user first navigates to a space, Replicache downloads the data and stores it persistently in the browser.

> The application reads and writes only to its local copy of the data. Thus the application responds instantly to all interaction by default.

> Replicache synchronizes changes to the server and other clients continuously in the background. Users see each others’ changes live.

> Conflicts happen if two users edit data concurrently. Replicache merges conflicts using a form of server reconciliation — an intuitive and powerful technique from multiplayer games.

> If sync can’t happen because the server is down or there’s no network, changes are queued persistently until the server comes back. Replicache apps can smoothly transit online, offline, and unreliable networks.



---

Possible conversion of the nixpkgs manual from docbook to mdbook
https://github.com/NixOS/nixpkgs/issues/156309

> syntax highlighting to be done at build time

yes. aka server side rendering (SSR)

> the search functionality is reliant on JavaScript

mdbook generates a print version (everything on one page) where users can Ctrl+F

> we should now focus on choosing the toolchain

javascript?
popular language for prototyping, more "hackable" than haskell (pandoc), can run in a browser

the main transforms are from markdown to html and manpage.
transforming from html to pdf/epub/... is trivial

### inplace editing

in a perfect world, all transforms are lenses (bidirectional transforms), so we can offer inplace editing:
read docs in a browser, find error, click "edit" button,
doc becomes editable (prosemirror editor, no page reload),
Ctrl+S to commit changes, changes are transformed back to markdown,
click "push" button to create github PR with commits

> ... will probably only be implemented if someone who cares does that.

yepp : /
ideally, such a system exists already,
or we collaborate with other projects to build such a system.
i want this for [my own project](https://github.com/milahu/alchi), so i have some interest to build this

### survey of tools

https://github.com/iilab/contentascode/issues/5

#### dokieli

https://github.com/linkeddata/dokieli

https://dokie.li/

inplace editor ("In-browser document authoring")

wysiwyg editor

no markdown editor

#### pen

https://github.com/sofish/pen

inplace editor

wysiwyg editor

markdown editor

#### prose

https://github.com/prose/prose

https://prose.io/

github editor

file browser

markdown editor

no wysiwyg editor
https://github.com/prose/prose/issues/935

no inplace editor

#### fiduswriter

https://github.com/fiduswriter/fiduswriter

based on prosemirror

desktop app (no web version? no online demo?)

#### manuscripts

https://www.manuscripts.io/

A simple authoring tool for complex documents.

https://gitlab.com/mpapp-public/manuscripts-frontend

based on react

based on prosemirror?

"track changes" plugin for prosemirror
https://gitlab.com/mpapp-public/manuscripts-track-changes
