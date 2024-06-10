/* @refresh reload */
import { range } from "lodash";
import { onCleanup, onMount } from "solid-js";
import gsap from "gsap";
import { nanoid } from "nanoid";

import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  GridHelper,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Shape,
  SpotLight,
  SpotLightHelper,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { assertValue } from "@/utils/assert";
import { promiseWithCancel } from "@/utils/async";

import { getColor } from "./utils";
import { navbarState, setNavbarState } from "./Navbar";
import { getMemoizedTowerSolution, type Step } from "./solver";

import tilePNG from "./assets/lab1_flr4.png";

const renderer = new WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;

const loader = new TextureLoader();

const textureLightnoise = loader.load("/lightnoise.png");
textureLightnoise.colorSpace = SRGBColorSpace;

const textureTile1 = loader.load(tilePNG);
textureTile1.colorSpace = SRGBColorSpace;
textureTile1.magFilter = NearestFilter;
textureTile1.wrapS = RepeatWrapping;
textureTile1.wrapT = RepeatWrapping;
textureTile1.repeat.set(8, 8);

export function App3D() {
  let sceneContainerEl: HTMLDivElement;
  let animator: Animator;

  const camera = new PerspectiveCamera(75, 1, 0.1, 50);
  camera.position.set(0, 7, 11);
  camera.lookAt(0, 0, -10);

  // const controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.25;
  // controls.target.set(0, 5, 0);

  const scene = new Scene();
  scene.background = new Color(0x004477);
  setupScene(scene);
  const disksGroup = scene.getObjectByName("disks")!;

  function resetState() {
    if (animator) {
      animator.stop();
    }

    disksGroup.clear();
    const disks = makeDisks(scene.userData.width, navbarState.disks);
    disksGroup.add(...disks);
    animator = new Animator(
      scene,
      [disks.map((disk) => disk.name), [], []],
      navbarState.disks
    );
  }

  function loop() {
    renderer.render(scene, camera);
    // controls.update();
  }

  onMount(() => {
    resetState();

    renderer.setSize(
      sceneContainerEl.clientWidth,
      sceneContainerEl.clientHeight
    );
    sceneContainerEl.appendChild(renderer.domElement);

    function onStart() {
      if (navbarState.isStarted) {
        resetState();
        setNavbarState("isStarted", false);
      } else {
        animator.play();
        setNavbarState("isStarted", true);
      }
    }

    function onReset() {
      resetState();
      setNavbarState("isStarted", false);
    }

    document.addEventListener("hanoistart", onStart);
    document.addEventListener("hanoireset", onReset);

    onCleanup(() => {
      document.removeEventListener("hanoistart", onStart);
      document.removeEventListener("hanoireset", onReset);
    });

    renderer.setAnimationLoop(loop);
  });

  return (
    <main class="mt-4 flex flex-col m-auto w-fit pt-8">
      <div
        ref={sceneContainerEl!}
        class="w-[320px] sm:w-[600px] aspect-video"
      />
    </main>
  );
}

const PEG_RADIUS = 0.25;
const DISK_HEIGHT = 0.8;

function setupScene(scene: Scene) {
  scene.userData.width = 10;

  const ambientLight = new AmbientLight(0xffffff, 2);
  ambientLight.position.y = 10;

  const spotLight = new PointLight(0xffffff, 25, 30, Math.PI / 5);
  spotLight.castShadow = true;
  spotLight.position.set(0, 12, 5);
  spotLight.lookAt(0, 0, 0);

  const pegs = new Group();
  pegs.translateX(-scene.userData.width / 2);
  pegs.add(...range(3).map((i) => makePeg((i * scene.userData.width) / 2)));

  const disks = new Group();
  disks.name = "disks";
  disks.translateX(-scene.userData.width / 2);
  disks.translateY(DISK_HEIGHT);

  const groundMaterial = new MeshStandardMaterial({
    map: textureTile1,
    side: DoubleSide,
  });
  const ground = new Mesh(new PlaneGeometry(20, 20), groundMaterial);
  ground.rotateX(Math.PI / 2);
  ground.receiveShadow = true;

  scene.add(
    // new GridHelper(scene.userData.width),
    // new AxesHelper(scene.userData.width),
    // new SpotLightHelper(spotLight),
    // new PointLightHelper(spotLight),
    ground,
    pegs,
    disks,
    ambientLight,
    spotLight
  );
}

const pegMaterial = new MeshPhysicalMaterial({
  metalness: 0.7,
  iridescence: 0.2,
  color: 0x557700,
  // map: textureLightnoise,
  opacity: 0.9,
});
const pegGeometry = new CylinderGeometry(PEG_RADIUS, PEG_RADIUS, 7);
function makePeg(x: number = 0) {
  const obj = new Mesh(pegGeometry, pegMaterial);
  obj.position.x = x;
  obj.translateY(3.5);
  obj.receiveShadow = true;
  obj.castShadow = true;
  return obj;
}

function makeDisks(sceneWidth: number, disks: number) {
  const k = sceneWidth / 4;
  return range(disks, 0, -1).map((w, i) =>
    makeDisk(
      0,
      i * DISK_HEIGHT,
      PEG_RADIUS + (w / disks) * k,
      new Color(getColor(i, disks))
    )
  );
}

function makeDisk(x: number, y: number, r: number, color: Color) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.arc(0, 0, r, 0, 2 * Math.PI);
  shape.holes.push(new Path().arc(0, 0, 1.5 * PEG_RADIUS, 0, 2 * Math.PI));

  const g = new ExtrudeGeometry(shape, {
    depth: DISK_HEIGHT,
    curveSegments: 36,
    bevelEnabled: false,
  });
  g.rotateX(Math.PI / 2);

  const m = new MeshPhysicalMaterial({
    color,
    roughness: 0.1,
    metalness: 0.2,
    reflectivity: 0.6,
  });
  const obj = new Mesh(g, m);
  obj.name = nanoid();
  obj.position.set(x, y, 0);
  obj.castShadow = true;
  obj.receiveShadow = true;
  return obj;
}

class Animator {
  private steps: Step[];
  private timeline: gsap.core.Timeline;
  private readonly stepDuration = 0.4;
  private abort = promiseWithCancel();

  constructor(
    private scene: Scene,
    private pegs: [string[], string[], string[]],
    disks: number
  ) {
    this.steps = getMemoizedTowerSolution(disks);
    this.timeline = gsap.timeline();
  }

  async play() {
    const width = this.scene.userData.width as number;

    for (const step of this.steps) {
      const [from, to] = step;
      const diskId = this.pegs[from - 1].pop();
      assertValue(diskId, `diskId is null, got ${diskId}`);
      const disk = this.scene.getObjectByName(diskId);
      assertValue(disk, `disk with id ${diskId} not found`);
      const order = this.pegs[to - 1].length;
      this.pegs[to - 1].push(diskId);

      const stepAnimation = this.timeline
        .to(disk.position, {
          y: 10,
          duration: this.stepDuration,
        })
        .to(disk.position, {
          x: ((to - 1) * width) / 2,
          duration: this.stepDuration,
        })
        .to(disk.position, {
          y: order * DISK_HEIGHT,
          duration: this.stepDuration,
        })
        .then();

      try {
        await Promise.race([this.abort, stepAnimation]);
      } catch (_) {
        return;
      }
    }
  }

  stop() {
    if (this.timeline.isActive()) {
      this.abort.cancel();
    }
    this.timeline.clear();
    this.timeline.kill();
  }
}
