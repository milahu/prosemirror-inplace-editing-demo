console.log("EditMenu.jsx: hello")

import { onMount, onCleanup, createSignal, lazy, Suspense, createEffect } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

// TOOD better
import { glob as globalStyle } from "solid-styled-components";

import pify from "pify";

import _git from "isomorphic-git"
import http from 'isomorphic-git/http/web'
// fix: Module "buffer" has been externalized for browser compatibility. Cannot access "buffer.Buffer" in client code.
// https://github.com/isomorphic-git/isomorphic-git/issues/1680
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import LightningFS from "@isomorphic-git/lightning-fs"

import TreeView from "./solidjs-treeview-component/src/TreeView.jsx"

const git = pify(_git);

// TOOD better
var className = 'file-tree';
globalStyle(`
  .${className}.tree-view.root { margin-left: 1px; margin-right: 1px; }
  .${className}.tree-view.root { height: 100%; /* fit to container */; overflow: auto; /* scroll on demand */ }
  .${className}.tree-view { text-align: left; }
  .${className}.tree-view,
  .${className}.tree-view ul { list-style: none; padding: 0; }
  .${className}.tree-view ul { padding-left: 0.5em; margin-left: 0.5em; border-left: solid 1px grey; }
  .${className}.tree-view li { white-space: pre; /* dont wrap on x overflow. TODO fix width on overflow */ }
  .${className}.tree-view li.branch > span { color: blue; font-family: monospace; }
  .${className}.tree-view li.branch > ul { display: none; /* default collapsed */ }
  .${className}.tree-view li.branch.expanded {  }
  .${className}.tree-view li.branch.expanded > ul { display: block; }
  .${className}.tree-view li.empty { font-style: italic; }
  .${className}.tree-view span.link-source { color: green; font-family: monospace; }
  .${className}.tree-view span.file { font-family: monospace; }
  .${className}.tree-view span.name { font-family: monospace; }
  .${className}.tree-view span.link-source,
  .${className}.tree-view span.file,
  .${className}.tree-view span.name { cursor: pointer; }
`);

export default function EditMenu() {

  //const fs = new LightningFS('fs') // old data. TODO implement "rm -rf"
  const fs = new LightningFS('fs2')
  globalThis.fs = fs;
  globalThis.ls = (path = "/") => fs.readdir(path, undefined, (error, files) => console.dir(error || files));

  // TODO check if file exists
  console.log("cloning ...")
  /*
  await git.clone({
    fs,
    http,
    dir: "/random",
    url: "https://try.gitea.io/milahu/random",
    //url: 'https://github.com/milahu/random',
    // TODO run cors proxy on localhost
    // or use limited api tokens for write access
    corsProxy: 'https://cors.isomorphic-git.org',
  })
  console.log("cloning done")
  */
  _git.clone({
    fs,
    http,
    //dir: "/random",
    //dir: "/test-repo",
    dir: "/",
    //url: "https://try.gitea.io/milahu/random",
    //url: 'https://github.com/milahu/random',
    url: "https://github.com/milahu/prosemirror-inplace-editing-demo-test-repo",
    // TODO run cors proxy on localhost
    // or use limited api tokens for write access
    corsProxy: 'https://cors.isomorphic-git.org',
  }).then((...args) => {
    console.log("cloning done", args)
  })



  /** @see ./solidjs-treeview-component/src/demo/App.jsx */

  const [state, setState] = createStore({
    fileList: [],
    fileSelected: '',
  });

  onMount(() => {
    loadFiles();
  });

  //const rootPath = "";
  const rootPath = "/"; // needed for fs.readdir

  async function loadFiles(node = null, prefix = '', get = null) {
    console.log("loadFiles node", unwrap(node));
    const path = (node && get) ? get.path(node, prefix) : rootPath;
    const keyPath = ['fileList'];
    const childNodesIdx = 3;
    let parentDir = state.fileList;
    console.log(`loadFiles build keyPath. prefix "${prefix}" + path "${path}"`);
    path.split('/').filter(Boolean).forEach((d, di) => {
      const i = parentDir.findIndex(([ depth, type, file, arg ]) => (type == 'd' && file == d));
      console.log(`loadFiles build keyPath. depth ${di}`, { parentDir, i, d });
      keyPath.push(i); parentDir = parentDir[i];
      keyPath.push(childNodesIdx); parentDir = parentDir[childNodesIdx];
    });

    //console.dir({ prefix, keyPath, val: state(...keyPath) })
    //console.dir({ prefix, keyPath, parentDir })

    if (parentDir.length > 0) {
      console.log(`already loaded path "${path}"`);
      return; // already loaded
    };

    /*
    // load files from API server
    const dataObject = { path };
    const postOptions = data => ({
      method: 'POST', body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    const response = await fetch(`/api/list`, postOptions(dataObject));
    if (!response.ok) { console.log(`http request error ${response.status}`); return; }
    const responseData = await response.json();
    //console.dir(responseData.files);
    */
    /*
    // mock the server response
    await sleep(500); // loading ...
    const depth = path.split('/').filter(Boolean).length;
    console.log(`loadFiles path = /${path} + depth = ${depth} + prefix = ${prefix}`);
    const responseData = {
      files: Array.from({ length: 5 }).map((_, idx) => {
        const typeList = 'dddfl'; // dir, file, link
        const type = typeList[Math.round(Math.random() * (typeList.length - 1))];
        if (type == 'd') return [ depth, type, `dirr-${depth}-${idx}`, [] ];
        if (type == 'f') return [ depth, type, `file-${depth}-${idx}` ];
        if (type == 'l') return [ depth, type, `link-${depth}-${idx}`, `link-target-${depth}-${idx}` ];
      }),
    }
    */
    // load files from fs
    // TODO update on changes in fs. inotify?
    const depth = path.split('/').filter(Boolean).length;
    console.log(`loadFiles path = "${path}" + depth "${depth}" + prefix "${prefix}"`);
    // note: sort is "case sensitive" by default
    // order: numbers, uppercase letters, lowercase letters
    // TODO folders first
    // TODO same sort order as on github
    // example: https://github.com/milahu/random
    // -> folders first + case sensitive
    const dirFiles = (await fs.promises.readdir(path || "/")).sort();
    console.log("dirFiles", dirFiles);
    const responseData = {
      files: await Promise.all(dirFiles.map(async (fileName) => {
        const filePath = path + "/" + fileName;
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
          return [ depth, "d", fileName, [] ];
        }
        else if (stats.isSymbolicLink()) {
          const linkTarget = await fs.promises.readlink(filePath);
          return [ depth, "l", fileName, linkTarget ];
        }
        else {
          return [ depth, "f", fileName ];
        }
      })),
    };

    //console.log("responseData", responseData);

    // add new files to the app state
    if (!state.fileList || state.fileList.length == 0)
      setState('fileList', responseData.files); // init
    else {
      //console.log(`add files for path ${path}`)
      setState(...keyPath, responseData.files);
    }
  }

  function fileTreeGetters() {
    const get = {};
    get.isLeaf = node => (node[1] != 'd');
    // append slash to directory names
    get.name = node => node[2] + ((node[1] == 'd') ? "/" : "");
    get.path = (node, prefix) => (prefix || rootPath) + get.name(node);
    get.childNodes = node => node[3];
    get.emptyLabel = (_prefix) => '( empty )';
    const isLink = node => (node[1] == 'l');
    const linkTarget = node => node[3];
    const simplePath = (node, _prefix) => (
      <span class="name">{get.name(node)}</span>
    );
    get.branchLabel = simplePath;
    // TODO open file in editor
    const getSelectFile = (node, prefix) => () => setState('fileSelected', get.path(node, prefix));
    get.leafLabel = (node, prefix) => {
      if (isLink(node))
        return <>
          <span class="link-source" onClick={getSelectFile(node, prefix)}>{simplePath(node, prefix)}</span>{" -> "}
          <span class="link-target">{linkTarget(node)}</span>
        </>;
      return <span class="file" onClick={getSelectFile(node, prefix)}>{simplePath(node, prefix)}</span>;
    };
    return get;
  }

  function fileListFilter() {
    //return node => (node[2][0] != '.'); // hide dotfiles
    return node => (node[2] != '.git'); // hide .git folder
  }
  /*
      <div>click on a directory to load more files</div>
      <div>click on a file to select it. selected file: {state.fileSelected ? <code>{state.fileSelected}</code> : '( none )'}</div>
  */
  return (
    <div>
      <h4>Files</h4>
      <div>
        <Suspense fallback={<div>Loading Files ...</div>}>
          <TreeView
            data={state.fileList}
            get={fileTreeGetters()}
            filter={fileListFilter()}
            load={loadFiles}
            className="file-tree"
          />
        </Suspense>
      </div>
      <h4>Editor</h4>
      <div>
        <Suspense fallback={<div>Loading Editor ...</div>}>
          <Editor file={state.fileSelected}/>
        </Suspense>
      </div>
    </div>
  );
}

function Editor(props) {
  const [value, setValue] = createSignal("");
  createEffect(async () => {
    setValue(props.file ? await fs.promises.readFile(props.file, "utf8") : "")
  })
  return (
    <textarea>{value}</textarea>
  );
}
