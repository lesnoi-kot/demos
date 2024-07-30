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

const BALLS_COUNT = 64;
const PINS_ROWS = 10;

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

  const camera = new T.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 20, 10);

  const scene = new T.Scene();
  scene.background = new T.Color(0x161616);

  const gravity = new T.Vector3(0, 0, 9.81);
  const world = new RAPIER.World(gravity);

  const board = new Board(0.5, 1, PINS_ROWS, world);

  setupScene(board, scene);
  scene.add(board);

  function generateBalls(count: number) {
    const ballsDiameter = board.ballsRadius * 2;
    const perRow = Math.floor(
      (board.planeWidth - board.borderWidth * 2 - ballsDiameter) /
        ballsDiameter,
    );
    const rows = Math.floor(count / perRow);

    for (let row = 0; row <= rows; row++) {
      const z =
        board.position.z -
        board.planeHeight / 2 +
        board.borderWidth * 2 +
        ballsDiameter +
        row * ballsDiameter;
      for (let i = 0; i < perRow; ++i) {
        const ball = new Ball(
          -board.planeWidth / 2 +
            board.borderWidth +
            ballsDiameter +
            i * ballsDiameter,
          0,
          z,
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.VSMShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.target.set(0, 0, 0);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("dblclick", () => {
      generateBalls(BALLS_COUNT);
    });

    generateBalls(BALLS_COUNT);
    world.bodies.forEach((body) => {
      syncMeshToBody(body);
    });

    renderer.setAnimationLoop(loop);
  });

  return <canvas ref={canvasEl!} />;
}

function setupScene(board: Board, scene: T.Scene) {
  const ambientLight = new T.AmbientLight(0xffffff, 0.2);

  const pointLight = new T.PointLight(0xffffff, 12, 0, 1);
  pointLight.castShadow = true;
  pointLight.position.y = 13;

  const spotLight = new T.SpotLight(0xffffff, 10, 20, Math.PI / 11, 0, 1);
  spotLight.position.set(0, 5, -board.planeHeight);
  spotLight.lookAt(0, 0, -board.planeHeight);

  scene.add(
    // new T.GridHelper(16, 16),
    // new T.AxesHelper(10),
    // new T.PointLightHelper(pointLight),
    // new T.SpotLightHelper(spotLight),
    ambientLight,
    spotLight,
    pointLight,
  );
}
