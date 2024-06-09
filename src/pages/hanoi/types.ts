import type { Signal } from "solid-js";

import type { Step } from "./solver";
import { range } from "lodash";
import { getColor } from "./utils";
import { nanoid } from "nanoid";

export type Disk = {
  id: string;
  isFlying: boolean;
  peg: number;
  order: number;
  width: number | string;
  color: string;
};
export type Peg = Disk[];
export type Pegs = [Peg, Peg, Peg];

export function newPegs(disks: number): Pegs {
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
