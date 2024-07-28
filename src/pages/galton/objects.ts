/* @refresh reload */

import * as T from "three";
import type { RigidBody, World } from "@dimforge/rapier3d";

import { woodenMaterial } from "./materials";
import { RAPIER } from "./rapier";
import { normalDistribution } from "./utils";
import {
  aluminiumTexture,
  woodTexture,
  osbNormalMap,
  osbTexture,
  woodNormalMap,
  woodAOMap,
  osbAOMap,
  glassNormalMap,
} from "./assets";

export class Board extends T.Group {
  fallHeight = 4.5;
  slotHeight = PitWall.depth;
  planeHeight: number;
  planeWidth: number;

  pins = new T.Group();
  // progress = new T.Group();

  constructor(
    public h: number,
    public l: number,
    public n: number,
    world: World,
  ) {
    super();
    this.planeHeight = n * h + this.fallHeight + this.slotHeight;
    this.planeWidth = (n + 1) * 2 * l + 0.5;

    const floorSolidColorMaterial = new T.MeshPhongMaterial({
      color: 0x976d47,
    });

    const osbMaterial = new T.MeshPhongMaterial({
      map: osbTexture,
      normalMap: osbNormalMap,
      aoMap: osbAOMap,
      side: T.DoubleSide,
    });

    const floor = new T.Mesh(
      new T.BoxGeometry(this.planeWidth, this.planeHeight, 0.1),
      [
        floorSolidColorMaterial,
        floorSolidColorMaterial,
        floorSolidColorMaterial,
        floorSolidColorMaterial,
        osbMaterial,
        osbMaterial,
      ],
    );
    floor.receiveShadow = true;
    floor.translateZ(this.planeHeight / 2 - this.fallHeight);
    floor.rotateX(-Math.PI / 2);

    const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.planeWidth / 2,
        this.planeHeight / 2,
        0.1 / 2,
      ).setFriction(0.8),
      floorBody,
    );
    floorBody.userData = { mesh: floor };

    const glass = new T.Mesh(
      new T.PlaneGeometry(this.planeWidth, this.planeHeight),
      new T.MeshPhysicalMaterial({
        normalMap: glassNormalMap,
        transparent: true,
        opacity: 0.5,
        reflectivity: 0.75,
        side: T.DoubleSide,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.95,
        clearcoat: 1,
        clearcoatRoughness: 0.3,
      }),
    );
    glass.translateY(1.05);
    glass.translateZ(this.planeHeight / 2 - this.fallHeight);
    glass.rotateX(-Math.PI / 2);

    const glassBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.planeWidth / 2,
        this.planeHeight / 2,
        0.1 / 2,
      ),
      glassBody,
    );
    glassBody.userData = { mesh: glass };

    // Bottom
    const bottomFloor = new WoodenBox(
      new T.BoxGeometry(this.planeWidth, 1, 0.5),
      0,
      0.5,
      this.planeHeight - this.fallHeight + 0.05,
    );
    this.add(bottomFloor);
    bottomFloor.createBody(world);

    {
      const angle = Math.atan2(h, l);
      const d = 11.5;
      const leftFence = new WoodenBox(
        new T.BoxGeometry(d, 1, 0.2),
        -3.5,
        0.5,
        3.2,
      );
      const rightFence = new WoodenBox(
        new T.BoxGeometry(d, 1, 0.2),
        3.5,
        0.5,
        3.2,
      );
      leftFence.rotateY(angle);
      rightFence.rotateY(-angle);

      this.add(leftFence, rightFence);
      leftFence.createBody(world);
      rightFence.createBody(world);
    }

    {
      const d = 5;
      const x = new WoodenBox(new T.BoxGeometry(d, 1, 0.2), -2.6, 0.5, -2.8);
      const y = new WoodenBox(new T.BoxGeometry(d, 1, 0.2), 2.6, 0.5, -2.8);
      x.rotateY(-Math.PI / 6);
      y.rotateY(Math.PI / 6);
      this.add(x, y);
      x.createBody(world);
      y.createBody(world);
    }

    // Pins
    for (let i = 1; i <= n; ++i) {
      const offsetX = 0 - (i - 1) * l;
      const offsetZ = (i - 1) * h;
      for (let j = 1; j <= i; ++j) {
        const pinMesh = new Pin(
          offsetX + (j - 1) * 2 * l,
          Pin.height / 2,
          offsetZ,
        );
        this.pins.add(pinMesh);

        const pinBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        world.createCollider(
          RAPIER.ColliderDesc.cylinder(Pin.height / 2, pinMesh.r),
          pinBody,
        );
        pinBody.userData = { mesh: pinMesh };
      }
    }

    // Bottom walls
    {
      const offsetX = -(n + 1) * l;
      const offsetZ = n * h;

      for (let j = 1; j <= n + 2; ++j) {
        const wall = new PitWall(
          offsetX + (j - 1) * 2 * l,
          PitWall.height / 2,
          offsetZ,
          j === 1 || j === n + 2 ? 6 : 5,
        );
        wall.translateZ(j === 1 || j === n + 2 ? 2 : 2.5);
        wall.createBody(world);
        this.add(wall);
      }
    }

    // Progress bars
    // for (let i = 0; i < n + 1; i++) {
    //   this.progress.add(new ProgressBar(i * (2 * l), 0, 0, 2 * l - 0.1));
    // }
    // this.progress.translateZ(this.planeHeight - this.fallHeight);
    // this.progress.translateX(-this.planeWidth / 2 + l + 0.25);

    // Bell curve
    const bell = new BellCurve(this.planeWidth, n);
    bell.translateZ(this.planeHeight - this.fallHeight);
    bell.translateY(1.1);
    bell.rotateX(-Math.PI / 2);

    this.add(floor, glass, bell, this.pins /*this.progress*/);
    // this.add(new T.AxesHelper(10));
  }

  collectBall(ball: Ball) {
    // const i = Math.floor(
    //   T.MathUtils.mapLinear(
    //     ball.position.x,
    //     -this.planeWidth / 2,
    //     this.planeWidth / 2,
    //     0,
    //     this.progress.children.length,
    //   ),
    // );
    // (this.progress.children[i] as ProgressBar).increase(0.1);
  }
}

export class Pin extends T.Mesh {
  r = 0.2;
  static height = 0.9;
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
    this.castShadow = true;
    this.receiveShadow = false;
    this.position.set(x, y, z);
  }
}

export class WoodenBox extends T.Mesh<T.BoxGeometry> {
  constructor(geometry: T.BoxGeometry, x: number, y: number, z: number) {
    const { width, height, depth } = geometry.parameters;
    const textureOffset = Math.random() * 5;
    const textureScale = 0.4;

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

  createBody(world: World): void {
    const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.geometry.parameters.width / 2,
        this.geometry.parameters.height / 2,
        this.geometry.parameters.depth / 2,
      ),
      wallBody,
    );
    wallBody.userData = { mesh: this };
  }
}

export class PitWall extends WoodenBox {
  static width = 0.1;
  static height = 1;
  static depth = 5;

  constructor(x: number, y: number, z: number, h: number = PitWall.depth) {
    super(new T.BoxGeometry(PitWall.width, PitWall.height, h), x, y, z);
  }
}

export class Ball extends T.Mesh {
  static ballMaterial = new T.MeshPhongMaterial({
    color: 0x333333,
    shininess: 2,
    reflectivity: 2,
    specular: 0xffffff,
  });

  isRemoved: boolean = false;
  collidedPins: Set<number> = new Set();

  constructor(x: number, y: number, z: number, public r: number, world: World) {
    super(new T.SphereGeometry(r), Ball.ballMaterial);
    this.position.set(x, y, z);
    this.translateY(2 * r);
  }

  createBody(world: World): void {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
    world.createCollider(
      RAPIER.ColliderDesc.ball(this.r).setRestitution(0.5).setMass(2),
      body,
    );
    body.userData = { mesh: this };
  }
}

export class ProgressBar extends T.Mesh {
  static barGeometry = new T.BoxGeometry(1, 1, 1);
  static barMaterial = new T.MeshBasicMaterial({
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
    this.visible = false;
  }

  increase(dh: number) {
    this.height += dh;
    this.visible = true;
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
    const scaleFactor = PitWall.depth / maxProbability;

    const shape = new T.Shape();
    shape.moveTo(-l / 2, 20 * normalDistribution(-l / 2, mu, sigma));
    for (let x = -l / 2; x <= l / 2; x += 0.25) {
      shape.lineTo(x, scaleFactor * normalDistribution(x, mu, sigma));
    }
    shape.closePath();

    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: false,
    });
    const material = new T.MeshPhongMaterial({
      color: 0x00aaff,
      opacity: 0.15,
      transparent: true,
      side: T.DoubleSide,
    });
    super(g, material);
  }
}
