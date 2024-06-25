import * as T from "three";

export class Board extends T.Group {
  fallHeight = 0;
  slotHeight = PitWall.height;
  planeHeight: number;
  planeWidth: number;
  pins = new T.Group();

  constructor(public h: number, public l: number, public n: number) {
    super();
    this.planeHeight = n * h + this.fallHeight + this.slotHeight;
    this.planeWidth = (n + 1) * 2 * l;
  }
}

export class Pin extends T.Mesh {
  r = 0.1;
  static height = 0.75;
  static pinGeometry = new T.CylinderGeometry(0.1, 0.1, Pin.height);
  static pinMaterial = new T.MeshBasicMaterial({ color: 0x1111ee });

  constructor(x: number, y: number, z: number) {
    super(Pin.pinGeometry, Pin.pinMaterial);
    this.position.set(x, y, z);
  }
}

export class PitWall extends T.Mesh {
  static height = 6;
  static width = 1;
  static pitGeometry = new T.BoxGeometry(0.1, PitWall.width, PitWall.height);
  static pitMaterial = new T.MeshBasicMaterial({ color: 0xeeaa33 });

  constructor(x: number, y: number, z: number) {
    super(PitWall.pitGeometry, PitWall.pitMaterial);
    this.position.set(x, y, z);
    this.translateZ(PitWall.height / 2);
  }
}

export class Ball extends T.Mesh {
  static ballMaterial = new T.MeshBasicMaterial({ color: 0x33ff11 });

  velocity = new T.Vector3(0, 0, 3);
  collidedPins: Set<number> = new Set();

  constructor(x: number, y: number, z: number, public r: number) {
    super(new T.SphereGeometry(r), Ball.ballMaterial);
    this.position.set(x, y, z);
    this.translateY(1.5 * r);
  }
}
