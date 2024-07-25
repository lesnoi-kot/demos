/* @refresh reload */

import * as T from "three";

import { normalDistribution } from "./utils";
import {
  aluminiumTexture,
  woodTexture,
  osbNormalMap,
  osbTexture,
  woodNormalMap,
  woodAOMap,
  osbAOMap,
} from "./assets";
import { woodenMaterial } from "./materials";

export class Board extends T.Group {
  fallHeight = 2.25;
  slotHeight = PitWall.height;
  planeHeight: number;
  planeWidth: number;
  pins = new T.Group();
  progress = new T.Group();
  walls = new T.Group();

  constructor(public h: number, public l: number, public n: number) {
    super();
    this.planeHeight = n * h + this.fallHeight + this.slotHeight;
    this.planeWidth = (n + 1) * 2 * l + 0.5;

    const plane = new T.Mesh(
      new T.PlaneGeometry(this.planeWidth, this.planeHeight),
      new T.MeshPhongMaterial({
        map: osbTexture,
        normalMap: osbNormalMap,
        aoMap: osbAOMap,
        side: T.DoubleSide,
      }),
    );
    plane.translateZ(this.planeHeight / 2 - this.fallHeight);
    plane.rotateX(-Math.PI / 2);

    const glass = new T.Mesh(
      new T.PlaneGeometry(this.planeWidth, this.planeHeight),
      new T.MeshPhongMaterial({
        // map: osbTexture,
        // normalMap: osbNormalMap,
        color: 0xffffff,
        transparent: true,
        // refractionRatio: 100,
        opacity: 0.1,
        // shininess: 100,
        // reflectivity: 100,
        side: T.DoubleSide,
      }),
    );
    glass.translateY(1);
    glass.translateZ(this.planeHeight / 2 - this.fallHeight);
    glass.rotateX(-Math.PI / 2);

    // Bottom
    this.walls.add(
      new WoodenBox(
        new T.BoxGeometry(this.planeWidth, 1, 0.1),
        0,
        0,
        this.planeHeight - this.fallHeight + 0.05,
      ),
    );

    {
      const angle = Math.atan2(h, l);
      const d = this.planeHeight / 1.5;
      const x = new WoodenBox(new T.BoxGeometry(d, 1, 0.1), -3.6, 0, 3.3);
      const y = new WoodenBox(new T.BoxGeometry(d, 1, 0.1), 3.6, 0, 3.3);
      x.rotateY(angle);
      y.rotateY(-angle);
      this.walls.add(x, y);
    }

    // Pins
    for (let i = 1; i <= n; ++i) {
      const offsetX = 0 - (i - 1) * l;
      const offsetZ = (i - 1) * h;
      for (let j = 1; j <= i; ++j) {
        this.pins.add(new Pin(offsetX + (j - 1) * 2 * l, 0, offsetZ));
      }
    }
    {
      const offsetX = -(n + 1) * l;
      const offsetZ = n * h;
      for (let j = 1; j <= n + 2; ++j) {
        const wall = new PitWall(offsetX + (j - 1) * 2 * l, 0, offsetZ);

        if (j === 1 || j === n + 2) {
          wall.scale.setZ(1.25);
          wall.translateZ((PitWall.height * 1.25) / 2);
          wall.translateZ(-PitWall.height * 0.25);
        } else {
          wall.translateZ(PitWall.height / 2);
        }

        this.walls.add(wall);
      }
    }

    // Progress bars
    for (let i = 0; i < n + 1; i++) {
      this.progress.add(new ProgressBar(i * (2 * l), 0, 0, 2 * l - 0.1));
    }
    this.progress.translateZ(this.planeHeight - this.fallHeight);
    this.progress.translateX(-this.planeWidth / 2 + l + 0.25);

    const bell = new BellCurve(this.planeWidth, n);
    bell.translateZ(this.planeHeight - this.fallHeight);
    bell.rotateX(-Math.PI / 2);

    this.pins.translateY(Pin.height / 2);
    this.walls.translateY(PitWall.width / 2);

    this.add(plane, glass, bell, this.pins, this.progress, this.walls);
    // this.add(new T.AxesHelper(10));
  }

  collectBall(ball: Ball) {
    const i = Math.floor(
      T.MathUtils.mapLinear(
        ball.position.x,
        -this.planeWidth / 2,
        this.planeWidth / 2,
        0,
        this.progress.children.length,
      ),
    );
    (this.progress.children[i] as ProgressBar).increase(0.1);
  }
}

export class Pin extends T.Mesh {
  r = 0.2;
  static height = 0.75;
  static pinGeometry = new T.CylinderGeometry(0.15, 0.2, Pin.height);

  constructor(x: number, y: number, z: number) {
    super(
      Pin.pinGeometry,
      new T.MeshPhongMaterial({
        map: woodTexture,
        normalMap: woodNormalMap,
        aoMap: woodAOMap,
        color: 0xdddddd,
      }),
    );
    this.position.set(x, y, z);
  }
}

export class WoodenBox extends T.Mesh {
  constructor(geometry: T.BoxGeometry, x: number, y: number, z: number) {
    const { width, height, depth } = geometry.parameters;
    const textureOffset = Math.random() * 5;
    const textureScale = 0.5;

    const materialLeft = woodenMaterial.clone();
    materialLeft.map = woodenMaterial.map!.clone();
    materialLeft.map?.repeat.set(depth, height).multiplyScalar(textureScale);
    materialLeft.map?.offset.setScalar(textureOffset);

    const materialRight = woodenMaterial.clone();
    materialRight.map = woodenMaterial.map!.clone();
    materialRight.map?.repeat.set(depth, height).multiplyScalar(textureScale);
    materialRight.map?.offset.setScalar(textureOffset);

    const materialTop = woodenMaterial.clone();
    materialTop.map = woodenMaterial.map!.clone();
    materialTop.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialTop.map?.offset.setScalar(textureOffset);

    const materialBottom = woodenMaterial.clone();
    materialBottom.map = woodenMaterial.map!.clone();
    materialBottom.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialBottom.map?.offset.setScalar(textureOffset);

    const materialFront = woodenMaterial.clone();
    materialFront.map = woodenMaterial.map!.clone();
    materialFront.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialFront.map?.offset.setScalar(textureOffset);

    const materialBack = woodenMaterial.clone();
    materialBack.map = woodenMaterial.map!.clone();
    materialBack.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialBack.map?.offset.setScalar(textureOffset);

    super(geometry, [
      materialRight,
      materialLeft,
      materialTop,
      materialBottom,
      materialFront,
      materialBack,
    ]);
    this.position.set(x, y, z);
  }
}

export class PitWall extends WoodenBox {
  static height = 5;
  static width = 1;
  static pitWallGeometry = new T.BoxGeometry(
    0.1,
    PitWall.width,
    PitWall.height,
  );

  constructor(x: number, y: number, z: number) {
    super(PitWall.pitWallGeometry, x, y, z);
    // this.scale.setZ(scaleZ);
    // this.translateZ((PitWall.height * scaleZ) / 2);
  }
}

export class Ball extends T.Mesh {
  static ballMaterial = new T.MeshPhongMaterial({
    color: 0x333333,
    shininess: 2,
    reflectivity: 2,
    specular: 0xffffff,
  });

  velocity = new T.Vector3(0, 0, 3);
  isRemoved: boolean = false;
  collidedPins: Set<number> = new Set();

  constructor(x: number, y: number, z: number, public r: number) {
    super(new T.SphereGeometry(r), Ball.ballMaterial);
    this.position.set(x, y, z);
    this.translateY(1.5 * r);
  }
}

export class ProgressBar extends T.Mesh {
  static barGeometry = new T.BoxGeometry(1, 1, 1);
  static barMaterial = new T.MeshPhongMaterial({
    color: 0x558855,
  });

  static {
    ProgressBar.barGeometry.translate(0, 0.5, -0.5);
  }

  height: number = 0;

  constructor(x: number, y: number, z: number, public width: number) {
    super(ProgressBar.barGeometry, ProgressBar.barMaterial);
    this.position.set(x, y, z);

    this.rescale();
  }

  increase(dh: number) {
    this.height += dh;
    this.rescale();
  }

  rescale() {
    this.scale.x = this.width;
    this.scale.z = this.height;
  }
}

export class BellCurve extends T.Mesh {
  constructor(l: number, N: number) {
    const p = 1 / 2;
    const mu = 0;
    const sigma = Math.sqrt(N * p * (1 - p));
    const maxProbability = normalDistribution(mu, mu, sigma);
    const scaleFactor = PitWall.height / maxProbability;

    const shape = new T.Shape();
    shape.moveTo(-l / 2, 20 * normalDistribution(-l / 2, mu, sigma));
    for (let x = -l / 2; x <= l / 2; x += 0.25) {
      shape.lineTo(x, scaleFactor * normalDistribution(x, mu, sigma));
    }
    shape.closePath();

    const g = new T.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    const material = new T.MeshBasicMaterial({
      color: 0x00aaff,
      opacity: 0.15,
      transparent: true,
      // side: T.DoubleSide,
    });
    super(g, material);
  }
}
