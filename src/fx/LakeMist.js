import * as THREE from 'three';

function createMistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(235,245,248,0.95)');
  gradient.addColorStop(0.45, 'rgba(215,228,232,0.45)');
  gradient.addColorStop(1, 'rgba(215,228,232,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class LakeMist {
  constructor(terrain) {
    this.terrain = terrain;
    this.texture = createMistTexture();
    this.group = new THREE.Group();
    this.group.name = 'Lake mist';
    this.sprites = [];
    this.createSprites();
  }

  createSprites() {
    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: 0xe6eef1,
        transparent: true,
        opacity: 0.16 + Math.random() * 0.1,
        depthWrite: false
      });

      const sprite = new THREE.Sprite(material);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
      const radius = 8 + Math.random() * (this.terrain.basinRadius + 10);
      sprite.position.set(
        this.terrain.basinCenter.x + Math.cos(angle) * radius,
        this.terrain.waterLevel + 1.1 + Math.random() * 1.6,
        this.terrain.basinCenter.y + Math.sin(angle) * radius * 0.65
      );
      const scale = 16 + Math.random() * 16;
      sprite.scale.set(scale * 1.8, scale, 1);
      sprite.userData = {
        anchorX: sprite.position.x,
        anchorY: sprite.position.y,
        anchorZ: sprite.position.z,
        speed: 0.12 + Math.random() * 0.24,
        phase: Math.random() * Math.PI * 2
      };
      this.group.add(sprite);
      this.sprites.push(sprite);
    }
  }

  update(elapsed) {
    for (const sprite of this.sprites) {
      const { anchorX, anchorY, anchorZ, speed, phase } = sprite.userData;
      sprite.position.x = anchorX + Math.sin(elapsed * speed + phase) * 2.6;
      sprite.position.y = anchorY + Math.sin(elapsed * speed * 0.8 + phase) * 0.22;
      sprite.position.z = anchorZ + Math.cos(elapsed * speed * 0.7 + phase) * 1.5;
      sprite.material.opacity = 0.12 + (Math.sin(elapsed * speed + phase) * 0.5 + 0.5) * 0.1;
    }
  }
}
