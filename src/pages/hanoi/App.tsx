/* @refresh reload */
import { debounce, range } from "lodash";
import { createMutable } from "solid-js/store";
import { For, batch, createSignal, onMount, type Signal } from "solid-js";
import { nanoid } from "nanoid";

import { assertValue } from "@/utils/assert";
import { sleep } from "@/utils/async";

import { getColor } from "./utils";
import { getMemoizedTowerSolution, type Step } from "./solver";

const DISK_TRANSITION_DURATION = 300;
const INITIAL_DISK_COUNT = 6;
const DISK_HEIGHT_PERCENT = 5.5; // "h-[5.5%]"" of container height
const [GET, SET] = [0, 1] as const;

type Disk = {
  id: string;
  isFlying: boolean;
  peg: number;
  order: number;
  width: number | string;
  color: string;
};
type Peg = Disk[];
type Pegs = [Peg, Peg, Peg];
type State = {
  readonly disks: number;
  isPlaying: Signal<boolean>;
  pegs: Pegs;
  steps: Step[];
  moveDisk(): Promise<void>;
};

function newPegs(disks: number): Pegs {
  const widthGrow = 100 / disks;

  return [
    range(disks, 0, -1).map((i, order) => ({
      id: nanoid(),
      isFlying: false,
      peg: 0,
      order,
      width: `${i * widthGrow}%`,
      color: getColor(order, disks),
    })),
    [],
    [],
  ];
}

function newState(disks: number): State {
  return {
    disks,
    isPlaying: createSignal(false),
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
        if (this.isPlaying[GET]()) {
          this.moveDisk();
        }
      }, 0);

      await sleep(DISK_TRANSITION_DURATION + 20);
      disk.isFlying = false;
      document.getElementById(disk.id)?.classList.add("animateRebound");
    },
  };
}

export function App() {
  const [state, setState] = createSignal(newState(INITIAL_DISK_COUNT));

  function resetGame(disks: number) {
    batch(() => {
      state().isPlaying[SET](false);
      setState(newState(disks));
    });
  }

  return (
    <main class="flex flex-col m-auto w-fit pt-8">
      <h1 class="text-3xl sm:text-[5vw] text-center">Hanoi towers</h1>
      <form
        class="flex gap-8 mt-8 items-center"
        onSubmit={(e) => {
          e.preventDefault();

          if (state().isPlaying[GET]()) {
            resetGame(state().disks);
          } else {
            state().isPlaying[SET](true);
            state().moveDisk();
          }
        }}
      >
        <button class="w-24">
          {state().isPlaying[GET]() ? "Reset" : "Start"}
        </button>

        <label class="space-x-2 text-xl">
          <span>Disks count:</span>
          <input
            class="w-16 p-2"
            min={1}
            max={13}
            maxLength={2}
            type="number"
            name="disks"
            value={INITIAL_DISK_COUNT}
            onInput={debounce((event) => {
              const value = event.target.value;
              if (value) {
                resetGame(Number(value));
              }
            })}
            pattern="\d+"
          />
        </label>
      </form>
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
