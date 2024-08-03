import { sample } from "lodash";
import gsap from "gsap";
import * as T from "three";
import { CSS3DRenderer, CSS3DSprite } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import "@/index.css";

import cat1 from "./cat1.webp";
import cat2 from "./cat2.webp";

const cats = [
  [cat1, "https://en.wikipedia.org/wiki/Black_cat"],
  [cat2, "https://en.wikipedia.org/wiki/Black_cat"],
];
const renderer = new CSS3DRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new T.Scene();
const root = new T.Group();
const camera = new T.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enablePan = false;

scene.add(root);

const sphere = new T.SphereGeometry(160, 20, 10);

function init() {
  document.body.appendChild(renderer.domElement);
  let prevVertex = new T.Vector3(),
    currVertex = new T.Vector3();

  const sphereVertices = sphere.getAttribute("position");

  for (let i = 0; i < sphereVertices.count; i++) {
    currVertex.set(
      sphereVertices.getX(i),
      sphereVertices.getY(i),
      sphereVertices.getZ(i),
    );

    if (currVertex.distanceTo(prevVertex) < 20) {
      continue;
    }

    const [cat, href] = sample(cats)!;
    const imgEl = document.createElement("img");
    imgEl.src = cat;
    imgEl.width = imgEl.height = 32;
    imgEl.draggable = false;
    imgEl.className = "rounded";
    const point = new CSS3DSprite(imgEl);
    point.position.copy(currVertex);
    prevVertex.copy(currVertex);
    root.add(point);
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let prevTime: number;

gsap.fromTo(
  camera.position,
  { z: 1300 },
  { z: 330, duration: 3, ease: "elastic.out(0.6,0.5)" },
);

function animate(time: number) {
  const dt = (time - prevTime) / 1000;
  prevTime = time;
  root.rotateY((dt * Math.PI) / 6);
  controls.update(time);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
animate((prevTime = performance.now()));
