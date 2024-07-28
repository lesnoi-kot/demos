import * as T from "three";
import type { RigidBody } from "@dimforge/rapier3d";

export let RAPIER: typeof import("@dimforge/rapier3d");

export const rapierPromise = import("@dimforge/rapier3d").then((module) => {
  RAPIER = module;
});

let tmpVector: T.Vector3 = new T.Vector3();
let tmpQuat: T.Quaternion = new T.Quaternion();

export function syncBodyToMesh(body: RigidBody) {
  if (
    body.userData &&
    typeof body.userData === "object" &&
    "mesh" in body.userData
  ) {
    const mesh = body.userData.mesh as T.Object3D;
    mesh.position.copy(
      mesh.parent!.worldToLocal(tmpVector.copy(body.translation())),
    );
    mesh.quaternion.copy(tmpQuat.copy(body.rotation()));
  }
}

export function syncMeshToBody(body: RigidBody) {
  if (
    body.userData &&
    typeof body.userData === "object" &&
    "mesh" in body.userData
  ) {
    const mesh = body.userData.mesh as T.Object3D;
    mesh.getWorldPosition(tmpVector);
    body.setTranslation(tmpVector, false);
    mesh.getWorldQuaternion(tmpQuat);
    body.setRotation(tmpQuat, true);
  }
}
