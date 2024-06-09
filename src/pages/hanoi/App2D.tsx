import { For, batch, createSignal, onCleanup, onMount } from "solid-js";
import { createMutable } from "solid-js/store";

import { assertValue } from "@/utils/assert";
import { sleep } from "@/utils/async";

import { getMemoizedTowerSolution, type Step } from "./solver";
import { newPegs, type Disk, type Pegs } from "./types";
import { navbarState, setNavbarState } from "./Navbar";

const DISK_TRANSITION_DURATION = 300;
const DISK_HEIGHT_PERCENT = 5.5; // "h-[5.5%]"" of container height

export type State = {
  readonly disks: number;
  isPlaying: boolean;
  pegs: Pegs;
  steps: Step[];
  moveDisk(): Promise<void>;
};

function newState(disks: number): State {
  return {
    disks,
    isPlaying: false,
    pegs: createMutable(newPegs(disks)),
    steps: [...getMemoizedTowerSolution(disks, 1, 3)].reverse(),
    async moveDisk() {
      const step = this.steps.pop();
      if (!step) {
        return;
      }
      const [from, to] = step;
      const disk = this.pegs[from - 1].filter((d) => !d.isFlying).at(-1);
      assertValue(disk, "Disk must be non null");

      batch(() => {
        disk.isFlying = true;
        disk.order = this.disks + 3;
      });

      await sleep(DISK_TRANSITION_DURATION + 20);
      batch(() => {
        this.pegs[from - 1].pop();
        this.pegs[to - 1].push(disk);
        disk.peg = to - 1;
      });

      await sleep(DISK_TRANSITION_DURATION + 20);
      disk.order = this.pegs[to - 1].length - 1;

      setTimeout(() => {
        if (this.isPlaying) {
          this.moveDisk();
        }
      }, 0);

      await sleep(DISK_TRANSITION_DURATION + 20);
      disk.isFlying = false;
      document.getElementById(disk.id)?.classList.add("animateRebound");
    },
  };
}

export function App2D() {
  const [state, setState] = createSignal(newState(navbarState.disks));

  function resetGame(disks: number) {
    batch(() => {
      state().isPlaying = false; // Stop async animations
      setState(newState(disks));
    });
  }

  onMount(() => {
    function onStart() {
      batch(() => {
        if (state().isPlaying) {
          resetGame(state().disks);
          setNavbarState("isStarted", false);
        } else {
          setNavbarState("isStarted", true);
          state().isPlaying = true;
          state().moveDisk();
        }
      });
    }

    function onReset() {
      resetGame(navbarState.disks);
      setNavbarState("isStarted", false);
    }

    document.addEventListener("hanoistart", onStart);
    document.addEventListener("hanoireset", onReset);

    onCleanup(() => {
      document.removeEventListener("hanoistart", onStart);
      document.removeEventListener("hanoireset", onReset);
    });
  });

  return (
    <div class="flex flex-col m-auto w-fit pt-8">
      <div class="grid grid-cols-3 grid-rows-1 items-end justify-items-center relative w-[min(80vw,1200px)] [aspect-ratio:320/160] mx-auto border-b-4 border-slate-950 dark:border-slate-400 rounded-sm">
        <Peg disks={state().disks} />
        <Peg disks={state().disks} />
        <Peg disks={state().disks} />
        <For
          each={state()
            .pegs.flat()
            .sort((a, b) => b.color.localeCompare(a.color))}
        >
          {(disk) => <Disk disk={disk} />}
        </For>
      </div>
    </div>
  );
}

function Disk(props: { disk: Disk }) {
  let ref: HTMLDivElement;

  onMount(() => {
    ref.addEventListener("animationend", () => {
      ref.classList.remove("animateRebound");
    });
  });

  return (
    <div
      ref={ref!}
      id={props.disk.id}
      class={`disk absolute w-1/3 left-0 bottom-0 h-[${DISK_HEIGHT_PERCENT}%]`}
      style={{
        transition: `translate ${DISK_TRANSITION_DURATION}ms ease-in-out`,
        translate: `${100 * props.disk.peg}% -${100 * props.disk.order}%`,
      }}
    >
      <div
        class="mx-auto h-full border-none rounded-sm bg-[url('/lightnoise10.png')]"
        style={{
          "border-bottom": "5px solid rgba(255 255 255 / .10)",
          width: `${props.disk.width}`,
          "background-color": props.disk.color,
        }}
      />
    </div>
  );
}

function Peg(props: { disks: number }) {
  return (
    <div
      class="w-[.8vw] bg-black dark:bg-slate-400 rounded-b-none rounded-md transition-all"
      style={{ height: `${(props.disks + 2) * DISK_HEIGHT_PERCENT}%` }}
    />
  );
}
