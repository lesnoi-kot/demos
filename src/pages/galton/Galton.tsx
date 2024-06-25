import { Show, createResource, onMount } from "solid-js";
import * as T from "three";
// import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { checkBallAndPinCollision } from "./utils";
import { Ball, Pin, Board, PitWall } from "./objects";

// import donutGLB from "./donut.glb?url";

// const gltfLoader = new GLTFLoader();
// let gltfScene: GLTF["scene"];

// const textureLoader = new T.TextureLoader();
// const cubeTextureLoader = new T.CubeTextureLoader().setPath("/skyboxes/");
// let skyboxTexture: T.CubeTexture;

const assetsLoadingPromise = Promise.all([
  // gltfLoader.loadAsync(donutGLB).then((gltf) => {
  //   gltfScene = gltf.scene;
  //   gltfScene.scale.multiplyScalar(10);
  // }),
  // cubeTextureLoader
  //   .loadAsync([
  //     "left.jpg",
  //     "right.jpg",
  //     "top.jpg",
  //     "bottom.jpg",
  //     "back.jpg",
  //     "front.jpg",
  //   ])
  //   .then((texture) => {
  //     skyboxTexture = texture;
  //   }),
]).then(() => true);

export function Galton() {
  const [completed] = createResource(() => assetsLoadingPromise);

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
  camera.position.set(0, 15, 6);

  const scene = new T.Scene();
  scene.background = new T.Color(0.3, 0.5, 0.5);
  setupScene(scene);

  const board = galtonBoard(1, 1, 6);
  scene.add(board);

  const gravity = new T.Vector3(0, 0, 9.81);
  const balls: Ball[] = [];
  let ballSpawnTime = performance.now();
  let lastTime = performance.now();

  function loop(time: DOMHighResTimeStamp) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    for (const ball of balls) {
      ball.velocity.addScaledVector(gravity, dt);
      if (ball.velocity.x !== 0) {
        const airDrag = new T.Vector3(-Math.sign(ball.velocity.x), 0, 0);
        ball.velocity.addScaledVector(airDrag, dt);
      }

      ball.position.addScaledVector(ball.velocity, dt);
      if (ball.position.z > board.planeHeight - ball.r) {
        ball.position.z = board.planeHeight - ball.r;
      }

      for (let pin of board.pins.children as Pin[]) {
        if (
          checkBallAndPinCollision(ball, pin) &&
          ball.position.z < pin.position.z
        ) {
          ball.position.z = pin.position.z - ball.r - pin.r - 0.01;
          ball.position.x = pin.position.x;

          const t = 1;
          ball.velocity.x =
            ((Math.random() < 0.5 ? 1 : -1) * (board.l - (-1 * t ** 2) / 2)) /
            t;
          ball.velocity.z = (1.75 * board.h - (gravity.z * t ** 2) / 2) / t;
          ball.collidedPins.add(pin.id);
          break;
        }
      }

      if (Math.abs(ball.velocity.x) < 0.01) {
        ball.velocity.x = 0;
      }
    }

    if (balls.length < 30 && time - ballSpawnTime >= 500) {
      ballSpawnTime = time;
      const ball = new Ball(0, 0, -5, Math.min(board.l, board.h) / 6);
      balls.push(ball);
      scene.add(ball);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  onMount(() => {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasEl,
    });
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

    renderer.setAnimationLoop(loop);
  });

  return <canvas ref={canvasEl!} />;
}

function setupScene(scene: T.Scene) {
  const ambientLight = new T.AmbientLight(0xffffff, 1);
  const pointLight = new T.PointLight(0xffffff, 10);
  pointLight.position.y = 10;
  scene.add(
    new T.GridHelper(16, 16),
    new T.AxesHelper(10),
    new T.PointLightHelper(pointLight),
    ambientLight,
    pointLight,
  );
  // scene.add(gltfScene);
}

function galtonBoard(h: number, l: number, n: number): Board {
  const board = new Board(h, l, n);
  const walls = new T.Group();

  const plane = new T.Mesh(
    new T.PlaneGeometry(board.planeWidth, board.planeHeight),
    new T.MeshBasicMaterial({ color: 0xee3333, side: T.DoubleSide }),
  );
  plane.translateZ(board.planeHeight / 2);
  plane.rotateX(Math.PI / 2);

  for (let i = 1; i <= n; ++i) {
    const offsetX = 0 - (i - 1) * l;
    const offsetZ = (i - 1) * h;
    for (let j = 1; j <= i; ++j) {
      board.pins.add(new Pin(offsetX + (j - 1) * 2 * l, 0, offsetZ));
    }
  }

  {
    const offsetX = -(n + 1) * l;
    const offsetZ = n * h;
    for (let j = 1; j <= n + 2; ++j) {
      const wall = new PitWall(offsetX + (j - 1) * 2 * l, 0, offsetZ);
      walls.add(wall);
    }

    // Pits floor
    walls.add(
      new T.Mesh(
        new T.BoxGeometry(board.planeWidth, 1, 0.1),
        new T.MeshBasicMaterial({ color: 0xeeaa33 }),
      ).translateZ(board.planeHeight),
    );
  }

  board.pins.translateY(Pin.height / 2);

  walls.translateY(PitWall.width / 2);

  board.add(plane, board.pins, walls);
  return board;
}
