import * as THREE from 'three';

export class Snow {
  constructor(terrain, { count = 2200, area = 240, height = 90 } = {}) {
    this.terrain = terrain;
    this.count = count;
    this.area = area;
    this.height = height;
    this.halfArea = area * 0.5;
    this.textureLoader = new THREE.TextureLoader();
    this.snowflakeTexture = this.textureLoader.load('./assets/assets/snowflake.png');
    this.snowflakeTexture.colorSpace = THREE.SRGBColorSpace;

    this.positions = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.velocities = new Float32Array(count);
    this.drifts = new Float32Array(count);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMap: { value: this.snowflakeTexture }
      },
      vertexShader: `
        attribute float aSize;
        uniform float uPixelRatio;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (140.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;

        void main() {
          vec4 texel = texture2D(uMap, gl_PointCoord);
          if (texel.a < 0.12) discard;
          gl_FragColor = vec4(texel.rgb, texel.a * 0.9);
        }
      `
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'Snow particles';
    this.points.frustumCulled = false;

    this.seed();
  }

  seed() {
    for (let i = 0; i < this.count; i += 1) {
      this.spawnParticle(i, Math.random() * this.height, true);
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  spawnParticle(index, yOffset = this.height, randomizeY = false) {
    const i3 = index * 3;
    const x = (Math.random() - 0.5) * this.area;
    const z = (Math.random() - 0.5) * this.area;
    const ground = this.terrain.getHeightAt(x, z);

    this.positions[i3] = x;
    this.positions[i3 + 1] = randomizeY
      ? ground + Math.random() * this.height
      : ground + yOffset;
    this.positions[i3 + 2] = z;

    this.sizes[index] = 4.6 + Math.random() * 5.8;
    this.velocities[index] = 6 + Math.random() * 7.5;
    this.drifts[index] = 0.25 + Math.random() * 0.85;
  }

  update(delta, elapsed) {
    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      const x = this.positions[i3];
      const z = this.positions[i3 + 2];

      this.positions[i3] += Math.sin(elapsed * 0.7 + i * 0.17) * this.drifts[i] * delta;
      this.positions[i3 + 2] += Math.cos(elapsed * 0.5 + i * 0.11) * this.drifts[i] * 0.55 * delta;
      this.positions[i3 + 1] -= this.velocities[i] * delta;

      if (this.positions[i3] > this.halfArea) {
        this.positions[i3] = -this.halfArea;
      } else if (this.positions[i3] < -this.halfArea) {
        this.positions[i3] = this.halfArea;
      }

      if (this.positions[i3 + 2] > this.halfArea) {
        this.positions[i3 + 2] = -this.halfArea;
      } else if (this.positions[i3 + 2] < -this.halfArea) {
        this.positions[i3 + 2] = this.halfArea;
      }

      const ground = this.terrain.getHeightAt(x, z);
      if (this.positions[i3 + 1] < ground + 0.4) {
        this.spawnParticle(i);
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  resize() {
    this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }
}
