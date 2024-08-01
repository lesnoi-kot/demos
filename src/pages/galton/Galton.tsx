import { Show, createResource, onMount } from "solid-js";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

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
  const stats = new Stats();

  const camera = new T.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 20, 10);

  const scene = new T.Scene();
  scene.background = new T.Color(0x161616);

  const gui = new GUI({ title: "Options" });
  gui
    .add({ debug: false }, "debug")
    .name("Debug")
    .onChange((debug) => {
      const debugHelpers = scene.getObjectByName("debugHelpers");
      if (debugHelpers) {
        debugHelpers.visible = debug;
      }
    });

  const gravity = new T.Vector3(0, 0, 9.81);
  const world = new RAPIER.World(gravity);

  const board = new Board(0.8, 1, PINS_ROWS, world);

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
        board.planeDepth / 2 +
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

    stats.update();
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

    document.body.appendChild(stats.dom);

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

  const pointLight = new T.PointLight(0xffffff, 10, 0, 1);
  pointLight.castShadow = true;
  pointLight.position.y = 5;

  const pointLightTop = new T.PointLight(0xffffff, 13, 0, 1);
  pointLightTop.castShadow = true;
  pointLightTop.position.set(0, 10, -10);

  const spotLight = new T.SpotLight(0xffffff, 40, 40, Math.PI / 11, 0, 1);
  spotLight.castShadow = true;
  spotLight.position.set(0, 18, board.planeDepth);
  spotLight.lookAt(0, 0, -board.planeDepth);

  const debugHelpers = new T.Group();
  debugHelpers.name = "debugHelpers";
  debugHelpers.visible = false;
  debugHelpers.add(
    new T.GridHelper(16, 16),
    new T.AxesHelper(10),
    new T.PointLightHelper(pointLight),
    new T.PointLightHelper(pointLightTop),
    new T.SpotLightHelper(spotLight),
  );

  scene.add(
    debugHelpers,
    ambientLight,
    // pointLightTop,
    // spotLight,
    pointLight,
  );
}
