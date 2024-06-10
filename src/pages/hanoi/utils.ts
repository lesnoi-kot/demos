export function getColor(l: number, r: number) {
  return `hsl(${(l / r) * 360}, 55%, 50%)`;
}

export const [GET, SET] = [0, 1] as const;
