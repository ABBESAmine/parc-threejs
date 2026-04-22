import * as THREE from 'three';
import { fbm2D } from './noise.js';

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function configureTexture(texture, repeat, colorSpace = THREE.NoColorSpace) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createGroundTextures(size = 512) {
  const colorCanvas = makeCanvas(size);
  const normalCanvas = makeCanvas(size);
  const roughnessCanvas = makeCanvas(size);
  const colorCtx = colorCanvas.getContext('2d');
  const normalCtx = normalCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');
  const colorImage = colorCtx.createImageData(size, size);
  const normalImage = normalCtx.createImageData(size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;
      const broad = fbm2D(nx * 6, ny * 6, 5);
      const detail = fbm2D(nx * 36, ny * 36, 4);
      const blade = fbm2D(nx * 84, ny * 20, 3);
      const dirt = Math.max(0, broad - 0.58) * 1.8;
      const shade = 0.78 + detail * 0.36 + blade * 0.12;
      const i = (y * size + x) * 4;

      colorImage.data[i] = Math.round((72 * (1 - dirt) + 98 * dirt) * shade);
      colorImage.data[i + 1] = Math.round((105 * (1 - dirt) + 88 * dirt) * shade);
      colorImage.data[i + 2] = Math.round((58 * (1 - dirt) + 45 * dirt) * shade);
      colorImage.data[i + 3] = 255;

      const sx = fbm2D((nx + 0.006) * 30, ny * 30, 4) - fbm2D((nx - 0.006) * 30, ny * 30, 4);
      const sy = fbm2D(nx * 30, (ny + 0.006) * 30, 4) - fbm2D(nx * 30, (ny - 0.006) * 30, 4);
      normalImage.data[i] = Math.round(128 - sx * 850);
      normalImage.data[i + 1] = Math.round(128 - sy * 850);
      normalImage.data[i + 2] = 232;
      normalImage.data[i + 3] = 255;

      const roughness = 172 + detail * 72 - dirt * 38;
      roughnessImage.data[i] = roughness;
      roughnessImage.data[i + 1] = roughness;
      roughnessImage.data[i + 2] = roughness;
      roughnessImage.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  normalCtx.putImageData(normalImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);

  return {
    map: configureTexture(new THREE.CanvasTexture(colorCanvas), 18, THREE.SRGBColorSpace),
    normalMap: configureTexture(new THREE.CanvasTexture(normalCanvas), 18),
    roughnessMap: configureTexture(new THREE.CanvasTexture(roughnessCanvas), 18)
  };
}
