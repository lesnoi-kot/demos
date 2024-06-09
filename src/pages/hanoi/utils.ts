export function getColor(l: number, r: number) {
  return `hsl(${(l / r) * 360}deg 55% 50% / 1)`;
}

export const [GET, SET] = [0, 1] as const;
