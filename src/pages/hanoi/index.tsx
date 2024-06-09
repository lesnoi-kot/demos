/* @refresh reload */
import { Match, Switch, render } from "solid-js/web";

import "@/index.css";

import { App2D } from "./App2D";
import { App3D } from "./App3D";
import { Navbar, navbarState } from "./Navbar";

import "./index.css";

render(
  () => (
    <main class="flex flex-col m-auto w-fit pt-8">
      <h1 class="text-3xl sm:text-[min(5vw,4rem)] text-center">Hanoi towers</h1>
      <Navbar />
      <Switch>
        <Match when={navbarState.tab === "2D"}>
          <App2D />
        </Match>
        <Match when={navbarState.tab === "3D"}>
          <App3D />
        </Match>
      </Switch>
    </main>
  ),
  document.getElementById("root")!
);
