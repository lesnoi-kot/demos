import * as T from "three";

import plywoodImage from "./plywood/Wood_Plywood_Front_001_basecolor.jpg";
import plywoodNormalImage from "./plywood/Wood_Plywood_Front_001_normal.jpg";

import aluminiumImage from "./aluminium.jpg";
import metalNormalImage from "./Metal_Diamond_001_NORM.jpeg";

import osbImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_basecolor.jpg";
import osbNormalImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_normal.jpg";
import osbAOImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_ambientOcclusion.jpg";
import osbMetalImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_metallic.jpg";
import osbRoughImage from "./Wood_Particle_Board_003_SD/Wood_Particle_Board_003_roughness.jpg";

import woodImage from "./wood/Wood_011_Base_Color.jpg";
import woodNormalImage from "./wood/Wood_011_Normal.jpg";
import woodAOImage from "./wood/Wood_011_ambientOcclusion.jpg";

import darkWoodImage from "./Wood_021_basecolor.jpg";

const textureLoader = new T.TextureLoader();

export let osbTexture: T.Texture;
export let osbNormalMap: T.Texture;
export let osbAOMap: T.Texture;
export let osbRoughMap: T.Texture;
export let osbMetalMap: T.Texture;

export let woodTexture: T.Texture;
export let woodNormalMap: T.Texture;
export let woodAOMap: T.Texture;

export let darkWoodTexture: T.Texture;

export let plywoodTexture: T.Texture;
export let plywoodNormalMap: T.Texture;

export let glassNormalMap: T.Texture;
export let aluminiumTexture: T.Texture;
export let metalNormalMap: T.Texture;

export const assetsLoadingPromise = Promise.all([
  // OSB
  textureLoader.loadAsync(osbImage).then((texture) => {
    osbTexture = texture;
    prepareTexture(osbTexture);
    osbTexture.repeat.set(1, 2);
  }),
  textureLoader.loadAsync(osbNormalImage).then((texture) => {
    osbNormalMap = texture;
    osbNormalMap.wrapS = osbNormalMap.wrapT = T.RepeatWrapping;
    osbNormalMap.repeat.set(1, 2);
  }),
  textureLoader.loadAsync(osbAOImage).then((texture) => {
    osbAOMap = texture;
    osbAOMap.wrapS = osbNormalMap.wrapT = T.RepeatWrapping;
    osbAOMap.repeat.set(1, 2);
  }),
  textureLoader.loadAsync(osbMetalImage).then((texture) => {
    osbMetalMap = texture;
    osbMetalMap.wrapS = osbMetalMap.wrapT = T.RepeatWrapping;
    osbMetalMap.repeat.set(1, 2);
  }),
  textureLoader.loadAsync(osbRoughImage).then((texture) => {
    osbRoughMap = texture;
    osbRoughMap.wrapS = osbRoughMap.wrapT = T.RepeatWrapping;
    osbRoughMap.repeat.set(1, 2);
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

  // Dark wood
  textureLoader.loadAsync(darkWoodImage).then((texture) => {
    darkWoodTexture = texture;
    prepareTexture(darkWoodTexture);
  }),

  // Plywood
  textureLoader.loadAsync(plywoodImage).then((texture) => {
    prepareTexture((plywoodTexture = texture));
  }),
  textureLoader.loadAsync(plywoodNormalImage).then((texture) => {
    plywoodNormalMap = texture;
  }),

  textureLoader.loadAsync(aluminiumImage).then((texture) => {
    prepareTexture((aluminiumTexture = texture));
    aluminiumTexture.repeat.set(0.5, 0.5);
  }),
  textureLoader.loadAsync(metalNormalImage).then((texture) => {
    prepareTexture((metalNormalMap = texture));
    metalNormalMap.repeat.set(1, 1);
    metalNormalMap.repeat.multiplyScalar(0.7);
  }),

  textureLoader.loadAsync("/Glass_normal.jpg").then((texture) => {
    glassNormalMap = texture;
    glassNormalMap.wrapS = glassNormalMap.wrapT = T.RepeatWrapping;
    glassNormalMap.repeat.set(2, 2);
  }),
]).then(() => true);

function prepareTexture(texture: T.Texture) {
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
}
