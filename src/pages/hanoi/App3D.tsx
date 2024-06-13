/* @refresh reload */
import { range, sample } from "lodash";
import {
  Show,
  createEffect,
  createResource,
  onCleanup,
  onMount,
} from "solid-js";
import gsap from "gsap";
import { nanoid } from "nanoid";
import * as T from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { assertValue } from "@/utils/assert";
import { promiseWithCancel } from "@/utils/async";

import { getColor } from "./utils";
import { getMemoizedTowerSolution, type Step } from "./solver";
import { navbarState, setNavbarState } from "./Navbar";

import sceneGLTF from "./assets/scene.glb?url";

const ASPECT = 16 / 9;

const gltfLoader = new GLTFLoader();
let gltfScene: GLTF["scene"];

const audioLoader = new T.AudioLoader();
const glassSoftImpact: AudioBuffer[] = [];

const textureLoader = new T.TextureLoader();
let bgTexture: T.Texture;

const renderer = new T.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);

const assetsLoadingPromise = Promise.all([
  gltfLoader.loadAsync(sceneGLTF).then((gltf) => {
    gltfScene = gltf.scene;
    gltfScene.rotateY(-Math.PI / 2);
  }),
  textureLoader.loadAsync("/spheremap.jpg").then((texture) => {
    bgTexture = texture;
  }),
  ...range(1, 4)
    .map((i) => `/sfx/glass_impact_soft${i}.wav`)
    .map((path) =>
      audioLoader.loadAsync(path).then((buffer) => {
        glassSoftImpact.push(buffer);
      })
    ),
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
  let sceneContainerEl: HTMLDivElement;
  let animator: Animator;

  const camera = new T.PerspectiveCamera(65, ASPECT, 0.1, 50);
  camera.position.set(0, 5, 11);
  camera.lookAt(0, 0, 0);

  const listener = new T.AudioListener();
  camera.add(listener);

  const sound = new T.Audio(listener);
  sound.setVolume(0.25);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.target.set(0, 5, 0);

  const scene = new T.Scene();
  setupScene(scene);
  scene.userData.sound = sound;
  scene.background = bgTexture;
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
    controls.update();
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

    function onResize() {
      if (renderer.domElement.clientWidth === sceneContainerEl.clientWidth) {
        return;
      }
      renderer.setSize(
        sceneContainerEl.clientWidth,
        (sceneContainerEl.clientWidth * 1) / ASPECT
      );
    }

    document.addEventListener("hanoistart", onStart);
    document.addEventListener("hanoireset", onReset);
    window.addEventListener("resize", onResize);

    onCleanup(() => {
      document.removeEventListener("hanoistart", onStart);
      document.removeEventListener("hanoireset", onReset);
      window.removeEventListener("resize", onResize);
    });

    renderer.setSize(
      sceneContainerEl.clientWidth,
      (sceneContainerEl.clientWidth * 1) / ASPECT
    );
    renderer.setAnimationLoop(loop);
  });

  createEffect(() => {
    const debugGroup = scene.getObjectByName("debug")!;
    controls.enabled = navbarState.debug;

    if (navbarState.debug) {
      debugGroup.add(
        new T.AxesHelper(scene.userData.width),
        ...scene
          .getObjectsByProperty("type", "PointLight")
          .map((light) => new T.PointLightHelper(light as T.PointLight))
      );
    } else {
      debugGroup.clear();
    }
  });

  return (
    <main class="mt-8">
      <div ref={sceneContainerEl!} class="max-w-xl w-full mx-auto" />
    </main>
  );
}

const PEG_RADIUS = 0.25;
const DISK_HEIGHT = 0.6;

function setupScene(scene: T.Scene) {
  scene.userData.width = 10;
  const ambientLight = new T.AmbientLight(0xffffff, 3);

  const mainLight = new T.PointLight(0xffffff, 25, 30, 1);
  mainLight.position.set(-5, 20, -2);
  mainLight.lookAt(0, 0, 0);

  const disksGroup = new T.Group();
  disksGroup.name = "disks";
  disksGroup.translateX(-scene.userData.width / 2);
  disksGroup.translateY(DISK_HEIGHT);

  const debugGroup = new T.Group();
  debugGroup.name = "debug";

  scene.add(gltfScene, disksGroup, debugGroup, ambientLight, mainLight);
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
  obj.userData.size = r;
  obj.name = nanoid();
  obj.position.set(x, y, 0);
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
          this.scene.userData.sound.setDetune((2 - disk.userData.size) * 300);
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
