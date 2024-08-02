import * as T from "three";

import {
  assetsLoadingPromise,
  plywoodTexture,
  plywoodNormalMap,
  darkWoodTexture,
} from "./assets";

export let woodenMaterial: T.MeshLambertMaterial;
export let darkWoodenMaterial: T.MeshLambertMaterial;

async function initMaterials() {
  await assetsLoadingPromise;

  woodenMaterial = new T.MeshLambertMaterial({
    color: 0xffffff,
    map: plywoodTexture,
    normalMap: plywoodNormalMap,
  });

  darkWoodenMaterial = new T.MeshLambertMaterial({
    color: 0xcccccc,
    map: darkWoodTexture,
  });
}

initMaterials();
