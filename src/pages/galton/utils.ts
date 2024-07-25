import { Vector2Like, Vector3 } from "three";
import type { Ball, Pin } from "./objects";

type CircleLike = Vector2Like & { r: number };

export function checkCirclesCollision(
  circle1: CircleLike,
  circle2: CircleLike,
): boolean {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  return Math.sqrt(dx * dx + dy * dy) <= circle1.r + circle2.r;
}

export function checkBallAndPinCollision(ball: Ball, pin: Pin): boolean {
  if (ball.collidedPins.has(pin.id)) {
    return false;
  }
  const pinGlobalPosition = new Vector3();
  pin.getWorldPosition(pinGlobalPosition);

  const dx = ball.position.x - pinGlobalPosition.x;
  const dy = ball.position.z - pinGlobalPosition.z;
  return (
    ball.position.z < pinGlobalPosition.z &&
    Math.sqrt(dx * dx + dy * dy) <= pin.r + ball.r
  );
}

export function normalDistribution(x: number, mu: number, sigma: number) {
  const exponent = -((x - mu) ** 2) / (2 * sigma ** 2);
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

export function linspace(from: number, to: number, n: number): number[] {
  const res = Array<number>(n);
  const d = (to - from) / n;
  let i = from;
  for (let j = 0; j < n - 1; ++j) {
    res[j] = i;
    i += d;
  }
  res[n - 1] = to;
  return res;
}
