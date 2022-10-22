// prosemirror "track changes" demo with fiduswriter ModTrack

// https://prosemirror.net/examples/basic/
// https://prosemirror.net/examples/track/

/*
https://github.com/ProseMirror/prosemirror-changeset
This is a helper module that can turn a sequence of document changes
into a set of insertions and deletions
*/

/*
https://gitlab.com/mpapp-public/plugin-persist
prosemirror plugin that automatically adds ID attributes to Nodes that need them,
to facilitate persistent storage in Pouch/Couchbase.

TODO remove. heavy dependency: @manuscripts/manuscript-transform
*/
//import persistPlugin from "@manuscripts/plugin-persist"

/*
https://gitlab.com/mpapp-public/manuscripts-track-changes
prosemirror plugin for tracking the state of a ProseMirror document over time,
and utilities for dealing with the data from that plugin.
*/
//import trackPlugin, { getTrackPluginState } from "@manuscripts/track-changes"
import * as TrackPlugin from "@manuscripts/track-changes"



/*
https://gitlab.com/mpapp-public/prosemirror-recreate-steps
This non-core prosemirror module allows
recreating the steps needed to go from document A to B
should these not be available otherwise,
and it allows merging two different Transforms (sets of steps)
whose steps may be conflicting.
*/


// plugin for tracking the state of a ProseMirror document over time,
// and utilities for dealing with the data from that plugin.
// https://www.npmjs.com/package/@manuscripts/track-changes
// https://gitlab.com/mpapp-public/manuscripts-track-changes

// TODO allow to undelete a selected deletion ("random access undo")

import './style.css' // minimal css for fiduswriter ModTrack
// css classes are defined in
// fiduswriter/document/static/js/modules/schema/common/track.js
// fiduswriter/document/static/js/modules/editor/state_plugins/track/plugin.js

import "prosemirror-view/style/prosemirror.css" // set white-space: pre-wrap, etc
import "prosemirror-menu/style/menu.css"
import "prosemirror-example-setup/style/style.css" // .ProseMirror-prompt, etc


import {EditorState, Plugin} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
import {exampleSetup} from "prosemirror-example-setup"

//import applyDevTools from "prosemirror-dev-tools";
// dependencies: "prosemirror-dev-tools": "*", "react": "*", "react-dom": "*", "unstated": "*"


// needed to show/hide the menuBar on focus/blur
// https://discuss.prosemirror.net/t/handling-focus-in-plugins/1981/6
//import { focusPlugin } from "./discuss.prosemirror.net/focus-plugin.js"

//import { docSchema } from "./github.com/fiduswriter/fiduswriter/fiduswriter/document/static/js/modules/schema/document"

import { buildKeymap } from "prosemirror-example-setup"
import { baseKeymap } from "prosemirror-commands"
import { keymap } from 'prosemirror-keymap'



/*
track changes
https://github.com/ProseMirror/website/blob/master/example/track/index.js

see also
https://github.com/newsdev/prosemirror-change-tracking-prototype/blob/master/index.js
https://github.com/TeemuKoivisto/prosemirror-track-changes-example/blob/master/src/pm/track-changes/track-changes-plugin.ts

track character changes (insert green, delete red)
https://github.com/fiduswriter/fiduswriter/issues/1142
https://github.com/milahu/prosemirror-track-changes-demo
*/
import {trackPlugin, highlightPlugin} from "./prosemirror-track.js"
import {Mapping} from "prosemirror-transform"



export class TextEditor {

  constructor(contentElement) {

    this.docSource = contentElement || document.querySelector('#content');

    this.docHistory = []
    this.docHistory.push(this.docSource.innerHTML)

    // Mix the nodes from prosemirror-schema-list into the basic schema to
    // create a schema with list support.
    this.schema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks
    })

    // fiduswriter statePlugins are inited in fiduswriter/document/static/js/modules/editor/collab/doc.js
    this.plugins = [];

    // TODO why?
    /*
    this.plugins.push(keymap(buildKeymap(this.schema)));
    this.plugins.push(keymap(baseKeymap));
    */

    var examplePlugins = exampleSetup({
      schema: this.schema,
      menuBar: true,
      floatingMenu: true,
    })

    /* TODO why?
    examplePlugins = examplePlugins.filter(p => ( // remove key handlers [quickfix]
      !Boolean(p.props?.handleKeyDown) &&
      !Boolean(p.props?.handleTextInput)
    ));
    */

    this.plugins.push(...examplePlugins);
    //console.log('TextEditor examplePlugins', examplePlugins);

    //this.plugins.push(focusPlugin);

    //this.plugins.push(persistPlugin())
    //this.plugins.push(TrackPlugin.default())

    this.plugins.push(trackPlugin)
    this.plugins.push(highlightPlugin)

    // replace document with editor
    const editorElement = document.createElement('div');
    editorElement.classList.add('text-editor')
    //editorElement.setAttribute('lang', this.docSource.getAttribute('lang'))
    this.docSource.parentNode.insertBefore(editorElement, this.docSource);
    this.docSource.style.display = 'none';
    this.docSource.classList.add('edit-original')

    // fiduswriter/fiduswriter/document/static/js/modules/editor/index.js initEditor
    let setFocus = false
    //this.app = {}; // not needed?
    this.clientTimeAdjustment = 0; // needed in amend_transaction.js
    this.user = { id: 0, username: "root" }; // needed in amend_transaction.js
    this.mod = {}; // modules
    this.docInfo = {};
    this.docInfo.updated = null;
    this.docInfo.access_rights = 'write-tracked'; // enable "track changes" for amend_transaction.js
    //this.schema = docSchema

    this.state = EditorState.create({
      doc: DOMParser.fromSchema(this.schema).parse(this.docSource),
      plugins: this.plugins,
    })

    this.view = new EditorView(editorElement, {
      state: this.state,
      handleDOMEvents: {
        // TODO why?
        focus: (view, _event) => {
          //console.log(`TextEditor focus`)
          if (!setFocus) {
            this.currentView = this.view
            // We focus once more, as focus may have disappeared due to
            // disappearing placeholders.
            setFocus = true
            view.focus()
            setFocus = false
          }
        }
      },
      //dispatchTransaction: this.dispatchTransaction,
      dispatchTransaction: tr => this.dispatchTransaction(tr),
    })
    this.currentView = this.view

    //applyDevTools(this.view);

    this.initTrackChanges()

  }

  initTrackChanges() {

    // based on https://prosemirror.net/examples/track/

    function elt(name, attrs, ...children) {
      let dom = document.createElement(name)
      if (attrs) for (let attr in attrs) dom.setAttribute(attr, attrs[attr])
      for (let i = 0; i < children.length; i++) {
        let child = children[i]
        dom.appendChild(typeof child == "string" ? document.createTextNode(child) : child)
      }
      return dom
    }

    //let lastRendered = null
    this.lastRendered = null

    //view = window.view = new EditorView(document.querySelector("#editor"), {state, dispatchTransaction})

    //this.dispatchTransaction(this.state.tr.insertText("Type something, and then commit it."))
    this.dispatchTransaction(this.state.tr.setMeta(trackPlugin, "Initial commit"))

    this.changes = {}

    this.changes.setDisabled = () => {
      let input = document.querySelector("#message")
      let button = document.querySelector("#commitbutton")
      input.disabled = button.disabled = trackPlugin.getState(this.state).uncommittedSteps.length == 0
    }

    this.changes.doCommit = (message) => {
      console.log("doCommit: this", this)
      console.log("doCommit: this.state", this.state)
      this.dispatchTransaction(this.state.tr.setMeta(trackPlugin, message))
    }

    this.changes.renderCommits = () => {
      console.log("dispatchTransaction: this.changes", this.changes)
      let curState = trackPlugin.getState(this.state)
      if (this.lastRendered == curState) return
      this.lastRendered = curState

      let out = document.querySelector("#commits")
      out.textContent = ""
      let commits = curState.commits
      commits.forEach(commit => {
        let node = elt("div", {class: "commit"},
                      elt("span", {class: "commit-time"},
                          commit.time.getHours() + ":" + (commit.time.getMinutes() < 10 ? "0" : "")
                          + commit.time.getMinutes()),
                      "\u00a0 " + commit.message + "\u00a0 ",
                      elt("button", {class: "commit-revert"}, "revert"))
        node.lastChild.addEventListener("click", () => revertCommit(commit))
        node.addEventListener("mouseover", e => {
          if (!node.contains(e.relatedTarget))
            this.dispatchTransaction(this.state.tr.setMeta(highlightPlugin, {add: commit}))
        })
        node.addEventListener("mouseout", e => {
          if (!node.contains(e.relatedTarget))
            this.dispatchTransaction(this.state.tr.setMeta(highlightPlugin, {clear: commit}))
        })
        out.appendChild(node)
      })
    }

    this.changes.revertCommit = function revertCommit(commit) {
      let trackState = trackPlugin.getState(this.state)
      let index = trackState.commits.indexOf(commit)
      // If this commit is not in the history, we can't revert it
      if (index == -1) return

      // Reverting is only possible if there are no uncommitted changes
      if (trackState.uncommittedSteps.length)
        return alert("Commit your changes first!")

      // This is the mapping from the document as it was at the start of
      // the commit to the current document.
      let remap = new Mapping(trackState.commits.slice(index)
                              .reduce((maps, c) => maps.concat(c.maps), []))
      let tr = this.state.tr
      // Build up a transaction that includes all (inverted) steps in this
      // commit, rebased to the current document. They have to be applied
      // in reverse order.
      for (let i = commit.steps.length - 1; i >= 0; i--) {
        // The mapping is sliced to not include maps for this step and the
        // ones before it.
        let remapped = commit.steps[i].map(remap.slice(i + 1))
        if (!remapped) continue
        let result = tr.maybeStep(remapped)
        // If the step can be applied, add its map to our mapping
        // pipeline, so that subsequent steps are mapped over it.
        if (result.doc) remap.appendMap(remapped.getMap(), i)
      }
      // Add a commit message and dispatch.
      if (tr.docChanged)
        this.dispatchTransaction(tr.setMeta(trackPlugin, `Revert '${commit.message}'`))
    }

    document.querySelector("#commit").addEventListener("submit", e => {
      e.preventDefault()
      this.changes.doCommit(e.target.elements.message.value || "Unnamed")
      e.target.elements.message.value = ""
      this.view.focus()
    })

    this.changes.findInBlameMap = (pos) => {
      let map = trackPlugin.getState(this.state).blameMap
      for (let i = 0; i < map.length; i++)
        if (map[i].to >= pos && map[i].commit != null)
          return map[i].commit
    }

    document.querySelector("#blame").addEventListener("mousedown", e => {
      e.preventDefault()
      let pos = e.target.getBoundingClientRect()
      let commitID = this.changes.findInBlameMap(this.state.selection.head, this.state)
      let commit = commitID != null && trackPlugin.getState(this.state).commits[commitID]
      let node = elt("div", {class: "blame-info"},
                    commitID != null ? elt("span", null, "It was: ", elt("strong", null, commit ? commit.message : "Uncommitted"))
                    : "No commit found")
      node.style.right = (document.body.clientWidth - pos.right) + "px"
      node.style.top = (pos.bottom + 2) + "px"
      document.body.appendChild(node)
      setTimeout(() => document.body.removeChild(node), 2000)
    })
  }

  // git branch icon
  // codicon-source-control-view-icon
  // https://seekicon.com/free-icon/git-branch-outline_1

  dispatchTransaction(tr) {
    //console.log("dispatchTransaction: this.state a", this.state)
    this.state = this.state.apply(tr)
    //console.log("dispatchTransaction: this.state b", this.state)
    this.view.updateState(this.state)
    //console.log("dispatchTransaction: this.changes", this.changes)
    if (this.changes) {
      this.changes.setDisabled()
      this.changes.renderCommits()
    }
  }



  save() {
    // TODO check if doc was changed
    this.docHistory.push(this.docSource.innerHTML)
    console.log('docHistory', this.docHistory)

    // getTrackPluginState(state: EditorState) => {commit: Commit, deco: DecorationSet, focusedCommit: string | null}
    // commits are recursive: each commit contains a reference to the previous commit.
    // The first commit contains null as the value of prev.
    const headCommit = TrackPlugin.getTrackPluginState(this.state)
    console.log("headCommit", headCommit)
    //console.log("commitToJSON(headCommit)", TrackPlugin.commitToJSON(headCommit))
    // TypeError: Cannot read properties of undefined (reading 'map') at recur (lib.js:29:125)
  }
}

/*
document.body.onload = function () {
  new TextEditor();
}
*/
