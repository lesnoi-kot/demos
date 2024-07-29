import { Show, createResource, onMount } from "solid-js";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { Ball, Board } from "./objects";
import { assetsLoadingPromise } from "./assets";
import {
  RAPIER,
  rapierPromise,
  syncBodyToMesh,
  syncMeshToBody,
} from "./rapier";
import type { World } from "@dimforge/rapier3d";

// const BALL_SPAWN_INTERVAL = 1000;
const BALLS_COUNT = 8;

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
  camera.position.set(0, 20, 0);
  camera.translateZ(5);

  const scene = new T.Scene();
  scene.background = new T.Color(0x363636);
  setupScene(scene);

  const gravity = new T.Vector3(0, 0, 9.81);
  const world = new RAPIER.World(gravity);

  const N = 10;
  const board = new Board(1, 1, N, world);
  scene.add(board);

  function generateBalls(count: number) {
    const rows = Math.floor(Math.sqrt(count));
    const perRow = rows;
    for (let row = 0; row < rows; row++) {
      const z = 4 + row * 2.25 * board.ballsRadius;
      for (let i = 0; i < perRow; ++i) {
        const ball = new Ball(
          perRow / 2 - i + Math.random() / 2,
          0,
          board.position.z - z,
          board.ballsRadius,
        );
        const body = ball.createBody(world);
        scene.add(ball);
        syncMeshToBody(body);
      }
    }
  }

  function loop(time: DOMHighResTimeStamp) {
    world.step();
    world.bodies.forEach((body) => {
      syncBodyToMesh(body);
    });

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
    controls.target.set(0, 0, 5);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("dblclick", () => {
      generateBalls(64);
      // world.bodies.forEach((body) => {
      //   syncMeshToBody(body);
      // });
    });

    generateBalls(64);
    world.bodies.forEach((body) => {
      syncMeshToBody(body);
    });

    renderer.setAnimationLoop(loop);
  });

  return <canvas ref={canvasEl!} />;
}

function setupScene(scene: T.Scene) {
  const ambientLight = new T.AmbientLight(0xffffff, 1.2);
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
