# Parc Three.js

Scene de nature en Three.js, sans npm, avec imports CDN.

## Lancement

Depuis la racine du projet :

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Etapes implementees

- Terrain procedural non plat, genere par programmation.
- Materiau de sol avec color map, normal map et roughness map procedurales.
- Herbe en `InstancedMesh`, placee aleatoirement et calee avec `getHeightAt(x, z)`.
- Ciel procedural avec `Sky.js`, ambiance coucher de soleil proche de `rendu.png`.

Les textures `*_grass.png` du dossier `assets` sont decoupees en 4 tuiles dans `assets/grass_tiles/` et utilisees pour l'herbe.
