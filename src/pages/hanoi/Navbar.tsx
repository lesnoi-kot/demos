import { debounce } from "lodash";
import { createStore } from "solid-js/store";

const INITIAL_DISK_COUNT = 5;

type NavbarState = {
  isStarted: boolean;
  disks: number;
  tab: "2D" | "3D";
};

export const [navbarState, setNavbarState] = createStore<NavbarState>({
  isStarted: false,
  disks: INITIAL_DISK_COUNT,
  tab: "3D",
});

export function Navbar() {
  return (
    <form
      class="flex gap-8 mt-8 items-center"
      onSubmit={(e) => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("hanoistart"));
      }}
    >
      <button class="w-24">{navbarState.isStarted ? "Reset" : "Start"}</button>

      <div class="flex flex-row gap-2">
        <label class="label cursor-pointer">
          <input
            class=""
            type="radio"
            name="tab"
            value="2D"
            checked={navbarState.tab === "2D"}
            onInput={() => {
              setNavbarState("tab", "2D");
            }}
          />
          <span class="label-text ml-2">2D</span>
        </label>

        <label class="label cursor-pointer">
          <input
            class=""
            type="radio"
            name="tab"
            value="3D"
            checked={navbarState.tab === "3D"}
            onInput={() => {
              setNavbarState("tab", "3D");
            }}
          />
          <span class="label-text ml-2">3D</span>
        </label>
      </div>

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
              setNavbarState("disks", Number(event.target.value));
              document.dispatchEvent(new CustomEvent("hanoireset"));
            }
          })}
          pattern="\d+"
        />
      </label>
    </form>
  );
}
