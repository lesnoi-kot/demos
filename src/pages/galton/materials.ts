import * as T from "three";

import {
  assetsLoadingPromise,
  plywoodTexture,
  plywoodNormalMap,
} from "./assets";

export let woodenMaterial: T.MeshPhongMaterial;

async function initMaterials() {
  await assetsLoadingPromise;

  woodenMaterial = new T.MeshPhongMaterial({
    color: 0xffffff,
    map: plywoodTexture,
    normalMap: plywoodNormalMap,
  });
}

initMaterials();
