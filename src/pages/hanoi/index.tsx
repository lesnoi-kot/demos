/* @refresh reload */
import { render } from "solid-js/web";

import "@/index.css";

import { App3D } from "./App3D";
import { Navbar } from "./Navbar";

import "./index.css";

render(
  () => (
    <main class="flex flex-col m-auto max-w-2xl pt-8">
      <h1 class="text-4xl sm:text-[clamp(2.5rem,5vw,4rem)] text-center leading-none">
        Hanoi towers
      </h1>
      <Navbar />
      <App3D />
    </main>
  ),
  document.getElementById("root")!
);
