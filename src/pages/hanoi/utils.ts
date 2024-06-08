export function getColor(l: number, r: number) {
  return `hsl(${(l / r) * 360}deg 55% 50% / 1)`;
}
