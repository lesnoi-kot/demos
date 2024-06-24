import { Vector2Like } from "three";
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
  const dx = ball.position.x - pin.position.x;
  const dy = ball.position.z - pin.position.z;
  return Math.sqrt(dx * dx + dy * dy) <= pin.r + ball.r;
}
