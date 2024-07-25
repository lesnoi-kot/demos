import * as T from "three";

import plywoodImage from "./plywood/Wood_Plywood_Front_001_basecolor.jpg";
import plywoodNormalImage from "./plywood/Wood_Plywood_Front_001_normal.jpg";

import aluminiumImage from "./aluminium.jpg";
import osbImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_basecolor.jpg";
import osbNormalImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_normal.jpg";
import osbAOImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_ambientOcclusion.jpg";

import woodImage from "./wood/Wood_011_Base_Color.jpg";
import woodNormalImage from "./wood/Wood_011_Normal.jpg";
import woodAOImage from "./wood/Wood_011_ambientOcclusion.jpg";

const textureLoader = new T.TextureLoader();

export let osbTexture: T.Texture;
export let osbNormalMap: T.Texture;
export let osbAOMap: T.Texture;

export let woodTexture: T.Texture;
export let woodNormalMap: T.Texture;
export let woodAOMap: T.Texture;

export let plywoodTexture: T.Texture;
export let plywoodNormalMap: T.Texture;

export let aluminiumTexture: T.Texture;

export const assetsLoadingPromise = Promise.all([
  // OSB
  textureLoader.loadAsync(osbImage).then((texture) => {
    osbTexture = texture;
    prepareTexture(osbTexture);
    osbTexture.repeat.set(2, 2);
  }),
  textureLoader.loadAsync(osbNormalImage).then((texture) => {
    osbNormalMap = texture;
    osbNormalMap.wrapS = osbNormalMap.wrapT = T.RepeatWrapping;
    osbNormalMap.repeat.set(2, 2);
  }),
  textureLoader.loadAsync(osbAOImage).then((texture) => {
    osbAOMap = texture;
    osbAOMap.wrapS = osbNormalMap.wrapT = T.RepeatWrapping;
    osbAOMap.repeat.set(2, 2);
  }),

  // Wood
  textureLoader.loadAsync(woodImage).then((texture) => {
    woodTexture = texture;
    prepareTexture(woodTexture);
  }),
  textureLoader.loadAsync(woodNormalImage).then((texture) => {
    woodNormalMap = texture;
  }),
  textureLoader.loadAsync(woodAOImage).then((texture) => {
    woodAOMap = texture;
  }),

  // Plywood
  textureLoader.loadAsync(plywoodImage).then((texture) => {
    prepareTexture((plywoodTexture = texture));
  }),
  textureLoader.loadAsync(plywoodNormalImage).then((texture) => {
    plywoodNormalMap = texture;
  }),

  textureLoader.loadAsync(aluminiumImage).then((texture) => {
    aluminiumTexture = texture;
  }),
]).then(() => true);

function prepareTexture(texture: T.Texture) {
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
}
