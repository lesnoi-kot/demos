/* @refresh reload */
import { range, sample } from "lodash";
import { onCleanup, onMount } from "solid-js";
import gsap from "gsap";
import { nanoid } from "nanoid";

import * as T from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { assertValue } from "@/utils/assert";
import { promiseWithCancel } from "@/utils/async";

import { getColor } from "./utils";
import { navbarState, setNavbarState } from "./Navbar";
import { getMemoizedTowerSolution, type Step } from "./solver";

import tilePNG from "./assets/lab1_flr4.png";

const renderer = new T.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;

const loader = new T.TextureLoader();
const audioLoader = new T.AudioLoader();

const glassSoftImpact: AudioBuffer[] = [];

[
  "/sfx/glass_impact_soft1.wav",
  "/sfx/glass_impact_soft2.wav",
  "/sfx/glass_impact_soft3.wav",
].forEach((path) => {
  audioLoader.load(path, (buffer) => {
    glassSoftImpact.push(buffer);
  });
});

const textureLightnoise = loader.load("/lightnoise.png");
textureLightnoise.colorSpace = T.SRGBColorSpace;

const textureTile1 = loader.load(tilePNG);
textureTile1.colorSpace = T.SRGBColorSpace;
textureTile1.magFilter = T.NearestFilter;
textureTile1.wrapS = T.RepeatWrapping;
textureTile1.wrapT = T.RepeatWrapping;
textureTile1.repeat.set(8, 8);

const textureJade = loader.load("/jade.jpg");
textureJade.colorSpace = T.SRGBColorSpace;

export function App3D() {
  let sceneContainerEl: HTMLDivElement;
  let animator: Animator;

  const camera = new T.PerspectiveCamera(75, 1, 0.1, 50);
  camera.position.set(0, 7, 11);
  camera.lookAt(0, 0, -18);

  const listener = new T.AudioListener();
  camera.add(listener);

  const sound = new T.Audio(listener);
  sound.setVolume(0.25);

  // const controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.25;
  // controls.target.set(0, 5, 0);

  const scene = new T.Scene();
  // scene.background = new Color(0x004477);
  setupScene(scene);
  scene.userData.sound = sound;
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
        class="w-[320px] sm:w-[600px] aspect-video bg-[url('/spheremap.jpg')] [background-position-y:60%]"
      />
    </main>
  );
}

const PEG_RADIUS = 0.25;
const DISK_HEIGHT = 0.8;

function setupScene(scene: T.Scene) {
  scene.userData.width = 10;

  const ambientLight = new T.AmbientLight(0xffffff, 4);
  ambientLight.position.y = 10;

  const spotLight = new T.PointLight(0xffffff, 25, 30, Math.PI / 5);
  spotLight.castShadow = true;
  spotLight.position.set(-5, 20, -2);
  spotLight.lookAt(0, 0, 0);

  const pegs = new T.Group();
  pegs.translateX(-scene.userData.width / 2);
  pegs.add(...range(3).map((i) => makePeg((i * scene.userData.width) / 2)));

  const disks = new T.Group();
  disks.name = "disks";
  disks.translateX(-scene.userData.width / 2);
  disks.translateY(DISK_HEIGHT);

  const groundMaterial = new T.MeshStandardMaterial({
    map: textureTile1,
    side: T.DoubleSide,
  });
  const ground = new T.Mesh(new T.PlaneGeometry(20, 20), groundMaterial);
  ground.rotateX(Math.PI / 2);
  ground.receiveShadow = true;

  const textureTile2 = textureTile1.clone();
  textureTile2.colorSpace = T.SRGBColorSpace;
  textureTile2.magFilter = T.NearestFilter;
  textureTile2.wrapS = T.RepeatWrapping;
  textureTile2.wrapT = T.RepeatWrapping;
  textureTile2.repeat.set(6, 2);
  const groundMaterial2 = new T.MeshStandardMaterial({
    map: textureTile2,
    color: 0x00aa11,
    transparent: true,
    opacity: 0.5,
  });
  const ground2 = new T.Mesh(new T.PlaneGeometry(15, 5), groundMaterial2);
  ground2.translateY(0.01);
  ground2.rotateX(-Math.PI / 2);
  ground2.receiveShadow = true;

  scene.add(
    // new GridHelper(scene.userData.width),
    // new AxesHelper(scene.userData.width),
    // new SpotLightHelper(spotLight),
    // new PointLightHelper(spotLight),
    ground,
    ground2,
    pegs,
    disks,
    ambientLight,
    spotLight
  );
}

textureJade.wrapS = T.RepeatWrapping;
textureJade.wrapT = T.RepeatWrapping;
textureJade.repeat.set(1, 2);

const pegMaterial = new T.MeshPhysicalMaterial({
  map: textureJade,
});
const pegGeometry = new T.CylinderGeometry(PEG_RADIUS, PEG_RADIUS, 7);
function makePeg(x: number = 0) {
  const obj = new T.Mesh(pegGeometry, pegMaterial);
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
      new T.Color(getColor(i, disks))
    )
  );
}

function makeDisk(x: number, y: number, r: number, color: T.Color) {
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  shape.arc(0, 0, r, 0, 2 * Math.PI);
  shape.holes.push(new T.Path().arc(0, 0, 1.5 * PEG_RADIUS, 0, 2 * Math.PI));

  const g = new T.ExtrudeGeometry(shape, {
    depth: DISK_HEIGHT,
    curveSegments: 36,
    bevelEnabled: false,
  });
  g.rotateX(Math.PI / 2);

  const m = new T.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    transmission: 0.75,
    reflectivity: 0.6,
    transparent: true,
    opacity: 0.9,
  });
  const obj = new T.Mesh(g, m);
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
    private scene: T.Scene,
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
        .then(() => {
          this.scene.userData.sound.setBuffer(sample(glassSoftImpact));
          this.scene.userData.sound.play();
        });
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
