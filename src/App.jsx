console.log("App.jsx: hello")

import logo from './logo.svg';
import styles from './App.module.css';

import { onMount, onCleanup, createSignal } from "solid-js";
import { lazy, Suspense } from "solid-js";

//import EditMenu from "./EditMenu.jsx";
const EditMenu = lazy(() => import("./EditMenu.jsx"));

function App() {
  const [isActive, set_isActive] = createSignal(false);
  return (
    <Switch>
      <Match when={isActive()}>
        <Suspense fallback={<div>Loading editor ...</div>}>
          <EditMenu/>
        </Suspense>
      </Match>
      <Match when={true}>
        <button onclick={() => set_isActive(true)}>edit this page</button>
      </Match>
    </Switch>
  )
}

export default App;
