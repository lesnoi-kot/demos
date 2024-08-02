import * as T from "three";
import type { RigidBody, World } from "@dimforge/rapier3d";

import { darkWoodenMaterial, woodenMaterial } from "./materials";
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
  metalNormalMap,
  osbRoughMap,
  osbMetalMap,
} from "./assets";

export class Board extends T.Group {
  fallHeight = 10;
  slotHeight = 6;
  borderWidth = 0.5;
  planeDepth: number;
  planeHeight: number = 0.1;
  planeWidth: number;
  boardHeight: number;
  ballsRadius: number;

  pins = new T.Group();

  #world: World;

  constructor(
    public h: number,
    public l: number,
    public n: number,
    world: World,
  ) {
    super();
    this.#world = world;
    this.planeDepth =
      n * h + this.fallHeight + this.slotHeight + this.borderWidth;
    this.planeWidth = (n + 1) * l + 2 * this.borderWidth;
    this.ballsRadius = (h * 0.5) / 2;
    this.boardHeight = this.ballsRadius * 5;
    const pinRadius = 0.23; //this.ballsRadius;

    const floorSolidColorMaterial = new T.MeshPhongMaterial({
      color: 0x976d47,
    });
    const osbMaterial = new T.MeshPhysicalMaterial({
      map: osbTexture,
      normalMap: osbNormalMap,
      aoMap: osbAOMap,
      roughnessMap: osbRoughMap,
      metalnessMap: osbMetalMap,
    });
    const floor = new T.Mesh(
      new T.BoxGeometry(this.planeWidth, this.planeHeight, this.planeDepth),
      [
        floorSolidColorMaterial,
        floorSolidColorMaterial,
        osbMaterial,
        osbMaterial,
        floorSolidColorMaterial,
        floorSolidColorMaterial,
      ],
    );
    floor.receiveShadow = true;

    const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.planeWidth / 2,
        this.planeHeight / 2,
        this.planeDepth / 2,
      ).setFriction(0),
      floorBody,
    );
    floorBody.userData = { mesh: floor };

    // Glass cover
    const glass = new T.Mesh(
      new T.PlaneGeometry(this.planeWidth, this.planeDepth),
      new T.MeshPhysicalMaterial({
        normalMap: glassNormalMap,
        transparent: true,
        opacity: 0.5,
        reflectivity: 0.75,
        metalness: 0,
        roughness: 0.1,
        transmission: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.3,
      }),
    );
    glass.castShadow = glass.receiveShadow = false;
    glass.translateY(this.boardHeight + 0.05);
    glass.rotateX(-Math.PI / 2);
    // glass.visible = false;

    const glassBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        this.planeWidth / 2,
        this.planeDepth / 2,
        0.1 / 2,
      ),
      glassBody,
    );
    glassBody.userData = { mesh: glass };

    this.#buildBorders();
    this.#buildRamps();

    // Pins
    for (let i = 1; i <= n; ++i) {
      const offsetX = (Number(i % 2) * l) / 2 - ((n - 1) * l) / 2;
      const offsetZ = -this.planeDepth / 2 + this.fallHeight + (i - 1) * h;
      for (let j = 1; j <= n - (i % 2); ++j) {
        const pinMesh = new Pin(
          offsetX + (j - 1) * l,
          this.boardHeight / 2,
          offsetZ,
          pinRadius,
          this.boardHeight,
        );
        this.pins.add(pinMesh);

        const pinBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        world.createCollider(
          RAPIER.ColliderDesc.cylinder(
            pinMesh.height / 2,
            pinMesh.r,
          ).setFriction(0.1),
          pinBody,
        );
        pinBody.userData = { mesh: pinMesh };
      }
    }

    this.#buildWalls();

    // Bell curve
    const bell = new BellCurve(this.planeWidth, n, this.slotHeight);
    bell.translateZ(this.planeDepth / 2);
    bell.translateY(this.boardHeight + 0.075);
    bell.rotateX(-Math.PI / 2);

    this.add(floor, glass, bell, this.pins);
  }

  #buildRamps() {
    const rampDepth = 7;
    const offsetZ = -this.planeDepth / 2 + this.fallHeight - rampDepth / 2;
    const rampHeight = this.boardHeight / 1.25;
    const leftRamp = new Ramp(
      this.planeWidth / 2 - this.borderWidth - this.ballsRadius * 2,
      rampDepth,
      rampHeight,
    );
    const rightRamp = new Ramp(
      this.planeWidth / 2 - this.borderWidth - this.ballsRadius * 2,
      rampDepth,
      rampHeight,
    );

    leftRamp.castShadow = true;
    leftRamp.receiveShadow = true;
    leftRamp.translateX(-this.planeWidth / 2 + this.borderWidth);
    leftRamp.translateZ(offsetZ);

    rightRamp.castShadow = true;
    rightRamp.receiveShadow = true;
    rightRamp.translateX(this.planeWidth / 2 - this.borderWidth);
    rightRamp.translateZ(offsetZ);
    rightRamp.rotateY(Math.PI);

    this.add(leftRamp, rightRamp);
    leftRamp.createBody(this.#world);
    rightRamp.createBody(this.#world);
  }

  #buildWalls() {
    const offsetX = (-(this.n + 1) * this.l) / 2;

    for (let j = 2; j < this.n + 2; ++j) {
      const wall = new PitWall(
        offsetX + (j - 1) * this.l,
        this.boardHeight / 2,
        this.planeDepth / 2 - this.slotHeight / 2,
        this.boardHeight,
        this.slotHeight,
      );

      this.add(wall);
      wall.castShadow = true;
      wall.createBody(this.#world);
    }
  }

  #buildBorders() {
    const bordersTextureScale = 0.2;
    // Bottom border
    const bottomBorder = new WoodenBox(
      new T.BoxGeometry(this.planeWidth, this.boardHeight * 2, 0.5),
      0,
      this.boardHeight / 2,
      this.planeDepth / 2 + 0.25,
      darkWoodenMaterial,
      bordersTextureScale,
    );
    bottomBorder.receiveShadow = bottomBorder.castShadow = true;
    this.add(bottomBorder);
    bottomBorder.createBody(this.#world);

    const borderHeight = this.boardHeight * 1.2;

    // Top border
    const topBorder = new WoodenBox(
      new T.BoxGeometry(this.planeWidth, borderHeight, this.borderWidth),
      0,
      borderHeight / 2,
      -this.planeDepth / 2 + this.borderWidth / 2,
      darkWoodenMaterial,
      bordersTextureScale,
    );
    topBorder.receiveShadow = topBorder.castShadow = true;
    this.add(topBorder);
    topBorder.createBody(this.#world);

    //Side borders
    const leftBorder = new WoodenBox(
      new T.BoxGeometry(this.borderWidth, borderHeight, this.planeDepth),
      -this.planeWidth / 2 + this.borderWidth / 2,
      borderHeight / 2,
      0,
      darkWoodenMaterial,
      bordersTextureScale,
    );
    const rightBorder = new WoodenBox(
      new T.BoxGeometry(this.borderWidth, borderHeight, this.planeDepth),
      this.planeWidth / 2 - this.borderWidth / 2,
      borderHeight / 2,
      0,
      darkWoodenMaterial,
      bordersTextureScale,
    );
    leftBorder.receiveShadow = leftBorder.castShadow = true;
    rightBorder.receiveShadow = rightBorder.castShadow = true;
    this.add(leftBorder, rightBorder);
    leftBorder.createBody(this.#world);
    rightBorder.createBody(this.#world);
  }
}

class Pin extends T.Mesh {
  constructor(
    x: number,
    y: number,
    z: number,
    public r: number,
    public height: number,
  ) {
    super(
      new T.CylinderGeometry(r / 1.25, r, height),
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

class WoodenBox extends T.Mesh<T.BoxGeometry, T.MeshLambertMaterial[]> {
  constructor(
    geometry: T.BoxGeometry,
    x: number,
    y: number,
    z: number,
    baseMaterial: T.MeshLambertMaterial = woodenMaterial,
    textureScale = 0.2,
  ) {
    const { width, height, depth } = geometry.parameters;
    const textureOffset = Math.random() * 5;

    const materialLeft = baseMaterial.clone();
    materialLeft.map = baseMaterial.map!.clone();
    materialLeft.map?.repeat.set(depth, height).multiplyScalar(textureScale);
    materialLeft.map?.offset.setScalar(textureOffset);

    const materialRight = baseMaterial.clone();
    materialRight.map = baseMaterial.map!.clone();
    materialRight.map?.repeat.set(depth, height).multiplyScalar(textureScale);
    materialRight.map?.offset.setScalar(textureOffset);

    const materialTop = baseMaterial.clone();
    materialTop.map = baseMaterial.map!.clone();
    materialTop.map?.repeat.set(width, depth).multiplyScalar(textureScale);
    materialTop.map?.offset.setScalar(textureOffset);

    const materialBottom = baseMaterial.clone();
    materialBottom.map = baseMaterial.map!.clone();
    materialBottom.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialBottom.map?.offset.setScalar(textureOffset);

    const materialFront = baseMaterial.clone();
    materialFront.map = baseMaterial.map!.clone();
    materialFront.map?.repeat.set(width, height).multiplyScalar(textureScale);
    materialFront.map?.offset.setScalar(textureOffset);

    const materialBack = baseMaterial.clone();
    materialBack.map = baseMaterial.map!.clone();
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

class PitWall extends WoodenBox {
  constructor(x: number, y: number, z: number, height: number, depth: number) {
    super(new T.BoxGeometry(0.2, height, depth), x, y, z);
  }
}

export class Ball extends T.Mesh {
  static ballMaterial = new T.MeshPhongMaterial({
    color: 0x333333,
    shininess: 1,
    reflectivity: 1,
    specular: 0x004455,
  });

  constructor(x: number, y: number, z: number, public r: number) {
    super(new T.SphereGeometry(r), Ball.ballMaterial);
    this.position.set(x, y, z);
    this.translateY(2 * r);
  }

  createBody(world: World): RigidBody {
    const mass = 3.5;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
    world.createCollider(
      RAPIER.ColliderDesc.ball(this.r)
        .setRestitution(0.2)
        .setFriction(0)
        .setMass(mass),
      body,
    );
    body.userData = { mesh: this };
    return body;
  }
}

class BellCurve extends T.Mesh {
  constructor(l: number, N: number, slotHeigth: number) {
    const p = 1 / 2;
    const mu = 0;
    const sigma = Math.sqrt(N * p * (1 - p));
    const maxProbability = normalDistribution(mu, mu, sigma);
    const scaleFactor = slotHeigth / maxProbability;

    const shape = new T.Shape();
    shape.moveTo(-l / 2, 20 * normalDistribution(-l / 2, mu, sigma));
    for (let x = -l / 2; x <= l / 2; x += 0.25) {
      shape.lineTo(x, scaleFactor * normalDistribution(x, mu, sigma));
    }
    shape.closePath();

    const g = new T.ExtrudeGeometry(shape, {
      depth: 0.025,
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

class Ramp extends T.Mesh<T.ExtrudeGeometry> {
  constructor(width: number, height: number, depth: number) {
    const shape = new T.Shape();
    const L = height;
    const R = 0.26153846153846155 * L;
    const W = width;

    shape.moveTo(0, 0);
    shape.lineTo(0, L);
    shape.lineTo(W, L - (L - R) / 2);
    shape.lineTo(W, (L - R) / 2);
    shape.closePath();
    const g = new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
    });
    g.rotateX(Math.PI / 2);
    g.translate(0, depth, -L / 2);
    g.computeVertexNormals();

    const material = new T.MeshPhongMaterial({
      normalMap: metalNormalMap,
      color: 0xfefefe,
      specular: 0x00aaff,
      shininess: 40,
      reflectivity: 1,
    });
    super(g, material);
  }

  createBody(world: World): RigidBody {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.convexMesh(
        this.geometry.getAttribute("position").array as Float32Array,
      )!.setFriction(0),
      body,
    );
    body.userData = { mesh: this };
    return body;
  }
}
