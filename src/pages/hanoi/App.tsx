/* @refresh reload */
import { range } from "lodash";
import { createMutable } from "solid-js/store";
import { For, batch, createSignal, onMount } from "solid-js";
import { nanoid } from "nanoid";

import { assertValue } from "@/utils/assert";
import { sleep } from "@/utils/async";

import { getColor } from "./utils";
import { getTowerSolution, type Step } from "./solver";

const DISK_TRANSITION_DURATION = 300;

type Disk = {
  id: string;
  peg: number;
  order: number;
  width: number | string;
  color: string;
};

type Peg = Disk[];

function newPegs(disks: number): [Peg, Peg, Peg] {
  const w = 100 / disks;

  return [
    range(disks, 0, -1).map((i, order) => ({
      id: nanoid(),
      peg: 0,
      order,
      width: `${i * w}%`,
      color: getColor(order, disks),
    })),
    [],
    [],
  ];
}

type State = {
  readonly disks: number;
  pegs: [Peg, Peg, Peg];
  steps: Step[];
};

function newState(disks: number): State {
  return { disks, pegs: newPegs(disks), steps: getTowerSolution(disks, 1, 3) };
}

export function App() {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const state = createMutable(newState(3));

  function nextStep() {
    const step = state.steps.shift();

    if (step) {
      moveDisk(step);
    } else {
      Array.from(document.getElementsByClassName("disk")).forEach((el) => {
        el.classList.add("animatePop");
      });
    }
  }

  async function moveDisk(step: Step) {
    const [from, to] = step;
    const disk = state.pegs[from - 1].at(-1);
    assertValue(disk, "Disk must be non null");

    disk.order = Math.max(state.disks + 1, 60 / 5);
    await sleep(DISK_TRANSITION_DURATION + 20);
    disk.peg = to - 1;
    await sleep(DISK_TRANSITION_DURATION + 20);
    disk.order = state.pegs[to - 1].length;
    await sleep(DISK_TRANSITION_DURATION + 20);
    batch(() => {
      state.pegs[from - 1].pop();
      state.pegs[to - 1].push(disk);
    });

    const diskEl = document.getElementById(disk.id);
    assertValue(diskEl, "Disk HTML element must be non null");
    diskEl.classList.add("animateRebound");

    setTimeout(nextStep, 0);
  }

  return (
    <main class="flex flex-col gap-6 m-auto w-fit pt-7">
      <h1 class="text-3xl text-center">Hanoi towers</h1>
      <div>
        <button
          onClick={() => {
            if (isPlaying()) {
              batch(() => {
                Object.assign(state, newState(6));
              });
            } else {
              nextStep();
            }

            setIsPlaying((v) => !v);
          }}
        >
          {isPlaying() ? "Reset" : "Start"}
        </button>
      </div>
      <div class="grid grid-cols-3 grid-rows-1 items-end justify-items-center relative w-[min(80vw,1200px)] [aspect-ratio:320/200] bg-slate-300 dark:bg-slate-700 border-b-4 border-slate-950 dark:border-slate-400 rounded-sm">
        <Peg disks={state.disks} />
        <Peg disks={state.disks} />
        <Peg disks={state.disks} />
        <For
          each={state.pegs
            .flat()
            .sort((a, b) => b.color.localeCompare(a.color))}
        >
          {(disk) => <Disk disk={disk} />}
        </For>
      </div>
    </main>
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
      class="disk absolute w-1/3 left-0 bottom-0 h-[5%]"
      style={{
        transition: `translate ${DISK_TRANSITION_DURATION}ms ease-in-out`,
        translate: `${100 * props.disk.peg}% -${100 * props.disk.order}%`,
      }}
    >
      <div
        class="mx-auto h-full border-none"
        style={{
          width: `${props.disk.width}`,
          background: props.disk.color,
        }}
      />
    </div>
  );
}

function Peg({ disks }: { disks: number }) {
  return (
    <div
      class="w-[1vw] bg-black dark:bg-slate-400 rounded-b-none rounded-md"
      style={{ height: `${(disks + 3) * 5}%` }}
    />
  );
}
