import { Show, createResource, onMount } from "solid-js";
import * as T from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import donutGLB from "./donut.glb?url";

const gltfLoader = new GLTFLoader();
let gltfScene: GLTF["scene"];

// const textureLoader = new T.TextureLoader();
const cubeTextureLoader = new T.CubeTextureLoader().setPath("/skyboxes/");
let skyboxTexture: T.CubeTexture;

const assetsLoadingPromise = Promise.all([
  gltfLoader.loadAsync(donutGLB).then((gltf) => {
    gltfScene = gltf.scene;
    gltfScene.scale.multiplyScalar(10);
  }),
  cubeTextureLoader
    .loadAsync([
      "left.jpg",
      "right.jpg",
      "top.jpg",
      "bottom.jpg",
      "back.jpg",
      "front.jpg",
    ])
    .then((texture) => {
      skyboxTexture = texture;
    }),
]).then(() => true);

export function App3D() {
  const [completed] = createResource(() => assetsLoadingPromise);

  return (
    <Show
      when={completed()}
      fallback={<h2 class="text-3xl mt-14 text-center">Loading...</h2>}
    >
      <App3DScene />
    </Show>
  );
}

export function App3DScene() {
  let canvasEl: HTMLCanvasElement;
  let renderer: T.WebGLRenderer;
  let controls: OrbitControls;

  const camera = new T.PerspectiveCamera(65, 1, 0.1, 10_000);
  camera.position.set(100, 100, -200);

  const scene = new T.Scene();
  scene.background = skyboxTexture;
  setupScene(scene);

  function loop() {
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
    controls.target.set(0, 0, 0);

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
  const pointLight = new T.PointLight(0xffffff, 80);
  pointLight.position.y = 25;
  scene.add(
    new T.GridHelper(100, 100),
    new T.AxesHelper(100),
    new T.PointLightHelper(pointLight),
    ambientLight,
    pointLight,
  );
}
