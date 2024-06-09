import { range } from "lodash";
import { onMount } from "solid-js";
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";

export function App3D() {
  let sceneContainerEl: HTMLDivElement;

  const scene = new Scene();
  const renderer = new WebGLRenderer();
  const camera = new PerspectiveCamera(75, 1);

  function loop() {}

  onMount(() => {
    renderer.setSize(
      sceneContainerEl.clientWidth,
      sceneContainerEl.clientHeight
    );
    sceneContainerEl.appendChild(renderer.domElement);
    // renderer.setAnimationLoop(loop);
    renderer.render(scene, camera);
  });

  // scene.add(getCube());
  scene.add(getLine());
  setupScene(scene);

  camera.position.z = 10;
  camera.position.y = 6;
  // camera.position.x = 2;
  camera.rotateX(MathUtils.DEG2RAD * -15);
  // camera.rotateY(MathUtils.DEG2RAD * 10);

  return (
    <main class="mt-4 flex flex-col m-auto w-fit pt-8">
      <div
        ref={sceneContainerEl!}
        class="w-[320px] sm:w-[600px] aspect-video"
      />
    </main>
  );
}

function getCube() {
  const geometry = new BoxGeometry(1, 16 / 9, 1);
  const material = new MeshBasicMaterial({ color: 0x00ff00 });
  return new Mesh(geometry, material);
}

function getLine() {
  const m = new LineBasicMaterial({ color: 0xff0000 });
  const points = [];
  points.push(new Vector3(-10, 0, 0));
  points.push(new Vector3(0, 10, 0));
  points.push(new Vector3(10, 0, 0));
  points.push(new Vector3(0, -10, 0));
  points.push(new Vector3(-10, 0, 0));
  const geometry = new BufferGeometry().setFromPoints(points);
  return new Line(geometry, m);
}

// function getGrid(width: number, height: number) {
//   const m = new LineBasicMaterial({ color: 0xff0000 });

//   const points = [

//   ];
//   new Vector3(0, 0, 0);
//   new Vector3(0, 10, 0);
//   new Vector3(10, 0, 0);
//   new Vector3(0, -10, 0);
//   new Vector3(-10, 0, 0);
//   const geometry = new BufferGeometry().setFromPoints(points);
//   return new Line(geometry, m);
// }

const PEG_RADIUS = 0.25;
const DISK_HEIGHT = 1;

function setupScene(scene: Scene) {
  const axes = new AxesHelper(5);
  const l1 = new AmbientLight(undefined, 2);
  l1.position.y = 8;
  const l2 = new SpotLight(0xff0000, 7);
  l2.position.y = 8;
  l2.position.z = 3;
  l2.lookAt(0, 0, 0);

  const pegs = new Group();
  pegs.add(...range(3).map((i) => makePeg(i * 5)));
  pegs.add(
    ...range(5, 0, -1).map((w, i) =>
      makeDisk(
        0,
        i * DISK_HEIGHT,
        PEG_RADIUS + w * 0.5,
        new Color(`hsl(${i * 30}, 80%, 65%)`)
      )
    )
  );
  pegs.translateX(-5);

  scene.add(new GridHelper(10), axes, pegs /*l1, l2*/);
}

function makePeg(x: number = 0) {
  const g = new CylinderGeometry(PEG_RADIUS, PEG_RADIUS, 7);
  const m = new MeshBasicMaterial({ color: 0x888888 });
  const obj = new Mesh(g, m);
  obj.position.x = x;
  obj.translateY(3.5);
  return obj;
}

function makeDisk(x: number, y: number, r: number, color: Color) {
  const g = new CylinderGeometry(r, r, DISK_HEIGHT);
  const m = new MeshBasicMaterial({ color });
  const obj = new Mesh(g, m);
  obj.position.x = x;
  obj.position.y = y;
  obj.translateY(DISK_HEIGHT / 2);
  return obj;
}
