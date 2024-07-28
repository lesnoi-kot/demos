/* @refresh reload */

import { Show, createResource, onMount } from "solid-js";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// import { checkBallAndPinCollision } from "./utils";
import { Ball, Pin, Board } from "./objects";
import { assetsLoadingPromise } from "./assets";
import {
  RAPIER,
  rapierPromise,
  syncBodyToMesh,
  syncMeshToBody,
} from "./rapier";

const BALL_SPAWN_INTERVAL = 1000;
const BALL_MAX_COUNT = 1;

export function Galton() {
  const [completed] = createResource(() =>
    Promise.all([assetsLoadingPromise, rapierPromise]),
  );

  return (
    <Show
      when={completed()}
      fallback={<h2 class="text-3xl mt-14 text-center">Loading...</h2>}
    >
      <GaltonScene />
    </Show>
  );
}

function GaltonScene() {
  let canvasEl: HTMLCanvasElement;
  let renderer: T.WebGLRenderer;
  let controls: OrbitControls;

  const camera = new T.PerspectiveCamera(65, 1, 0.1, 100);
  camera.position.set(0, 16, 0);

  const scene = new T.Scene();
  scene.background = new T.Color(0x363636);
  setupScene(scene);

  const gravity = new T.Vector3(0, 0, 9.81);
  const world = new RAPIER.World(gravity);

  const N = 10;
  const board = new Board(0.9, 0.6, N, world);
  board.translateZ(-5);
  scene.add(board);

  let balls: Ball[] = [];
  let ballSpawnTime = performance.now();
  let lastTime = performance.now();

  const ballRadius = Math.min(board.l, board.h) / 5;
  for (let z = 3; z < 6; z += 1.5 * ballRadius) {
    for (let i = 0; i < BALL_MAX_COUNT; ++i) {
      const ball = new Ball(
        Math.random() * 6 - 3,
        0,
        board.position.z - z,
        ballRadius,
        world,
      );
      ball.createBody(world);
      balls.push(ball);
      scene.add(ball);
    }
  }

  world.bodies.forEach((body) => {
    syncMeshToBody(body);
  });

  function loop(time: DOMHighResTimeStamp) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    world.bodies.forEach((body) => {
      syncBodyToMesh(body);
    });

    // for (let i = 0; i < balls.length; ++i) {
    //   const ball = balls[i];

    //   if (ball.isRemoved) {
    //     continue;
    //   }

    //   ball.velocity.addScaledVector(gravity, dt);
    //   if (ball.velocity.x !== 0) {
    //     const airDrag = new T.Vector3(-Math.sign(ball.velocity.x), 0, 0);
    //     ball.velocity.addScaledVector(airDrag, dt);
    //   }
    //   ball.position.addScaledVector(ball.velocity, dt);

    //   if (
    //     ball.position.z >
    //     board.position.z + board.planeHeight - board.fallHeight - ball.r
    //   ) {
    //     board.collectBall(ball);
    //     scene.remove(ball);
    //     ball.isRemoved = true;
    //     continue;
    //   }

    //   for (let pin of board.pins.children as Pin[]) {
    //     if (checkBallAndPinCollision(ball, pin)) {
    //       const pinGlobalPosition = new T.Vector3();
    //       pin.getWorldPosition(pinGlobalPosition);
    //       ball.position.z = pinGlobalPosition.z - ball.r - pin.r - 0.01;
    //       ball.position.x = pinGlobalPosition.x;

    //       const t = 0.5;
    //       const toss = Math.random() < 0.5 ? 1 : -1;
    //       ball.velocity.x = toss * ((board.l + t ** 2 / 2) / t);
    //       ball.velocity.z = (board.h - (gravity.z * t ** 2) / 2) / t;
    //       ball.collidedPins.add(pin.id);
    //       break;
    //     }
    //   }
    // }

    if (
      balls.length < BALL_MAX_COUNT &&
      time - ballSpawnTime >= BALL_SPAWN_INTERVAL
    ) {
      ballSpawnTime = time;
      const ball = new Ball(
        Math.random() * 0.25,
        Math.random() * 0.25,
        board.position.z - 1,
        Math.min(board.l, board.h) / 5,
        world,
      );
      balls.push(ball);
      scene.add(ball);
    }

    world.step();

    controls.update();
    renderer.render(scene, camera);
  }

  onMount(() => {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasEl,
    });
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = T.VSMShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    // controls.target.set(0, 0, 0);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onResize);

    renderer.setAnimationLoop(loop);
  });

  return <canvas ref={canvasEl!} />;
}

function setupScene(scene: T.Scene) {
  const ambientLight = new T.AmbientLight(0xffffff, 1.8);
  const pointLight = new T.PointLight(0xffffff, 7);
  pointLight.castShadow = true;
  pointLight.position.y = 5;

  scene.add(
    // new T.GridHelper(16, 16),
    // new T.AxesHelper(10),
    // new T.PointLightHelper(pointLight),
    ambientLight,
    pointLight,
  );
}
