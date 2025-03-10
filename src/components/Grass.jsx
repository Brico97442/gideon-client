import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { getVertexSource, fragmentSource } from "./Shader.js";
import PropTypes from 'prop-types';
import { useGLTF } from "@react-three/drei";

import bladeDiffuse from "../../public/textures/grass.webp";
import bladeAlpha from "../../public/textures/grassAlpha.png";

const defaultBladeOptions = {
  width: 0.2,
  height: 0.3,
  joints: 1
};

export default function Grass({
  bladeOptions = defaultBladeOptions,
  instances = 250000,
  groundModelPath = "/3d-models/gltf/cimetarylayout/ground.glb",
  position = [0, 0, 0],
  windStrength = 3.0,
  windFrequency = 1.0
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const timeRef = useRef(0); // Référence pour suivre le temps

  const [texture, alphaMap] = useLoader(THREE.TextureLoader, [
    bladeDiffuse,
    bladeAlpha
  ]);

  const [groundMesh, setGroundMesh] = useState(null);

  // Charger le modèle 3D du sol pour obtenir sa géométrie
  const { scene: groundScene } = useGLTF(groundModelPath);
  useEffect(() => {
    if (groundScene) {
      let mesh = null;
      groundScene.traverse((child) => {
        if (child.isMesh) {
          mesh = child;
        }
      });
      if (mesh) {
        setGroundMesh(mesh);
      } else {
        console.error("Aucun mesh trouvé dans le modèle du sol");
      }
    }
  }, [groundScene]);

  // Vérifiez que les textures sont correctement chargées
  useEffect(() => {
    if (!texture || !alphaMap) {
      console.error("Textures non chargées correctement");
    } else {
      console.log("Textures chargées avec succès");
    }
  }, [texture, alphaMap]);

  const baseGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      bladeOptions.width,
      bladeOptions.height,
      1,
      bladeOptions.joints
    );
    geo.translate(0, bladeOptions.height / 2, 0);
    return geo;
  }, [bladeOptions.width, bladeOptions.height, bladeOptions.joints]);

  const instancedGeometry = useMemo(() => {
    if (!baseGeometry || !groundMesh) return null;

    console.log("Création de la géométrie instanciée");

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.attributes.uv = baseGeometry.attributes.uv;

    // Ajouter les attributs d'instance
    const offsets = new Float32Array(instances * 3);
    const orientations = new Float32Array(instances * 4);
    const stretches = new Float32Array(instances);
    const halfRootAngleSin = new Float32Array(instances);
    const halfRootAngleCos = new Float32Array(instances);
    const windOffsets = new Float32Array(instances);

    const vertices = groundMesh.geometry.attributes.position.array;
    const indices = groundMesh.geometry.index.array;
    const faceCount = indices.length / 3;

    // Calculer la surface de chaque triangle
    const areas = new Float32Array(faceCount);
    let totalArea = 0;
    for (let i = 0; i < faceCount; i++) {
      const a = new THREE.Vector3(
        vertices[indices[i * 3] * 3],
        vertices[indices[i * 3] * 3 + 1],
        vertices[indices[i * 3] * 3 + 2]
      );
      const b = new THREE.Vector3(
        vertices[indices[i * 3 + 1] * 3],
        vertices[indices[i * 3 + 1] * 3 + 1],
        vertices[indices[i * 3 + 1] * 3 + 2]
      );
      const c = new THREE.Vector3(
        vertices[indices[i * 3 + 2] * 3],
        vertices[indices[i * 3 + 2] * 3 + 1],
        vertices[indices[i * 3 + 2] * 3 + 2]
      );

      const ab = b.clone().sub(a);
      const ac = c.clone().sub(a);
      const cross = new THREE.Vector3().crossVectors(ab, ac);
      const area = cross.length() / 2;
      areas[i] = area;
      totalArea += area;
    }

    // Distribuer les brins d'herbe en fonction de la surface
    for (let i = 0; i < instances; i++) {
      let r = Math.random() * totalArea;
      let faceIndex = 0;
      while (r > areas[faceIndex]) {
        r -= areas[faceIndex];
        faceIndex++;
      }

      const a = new THREE.Vector3(
        vertices[indices[faceIndex * 3] * 3],
        vertices[indices[faceIndex * 3] * 3 + 1],
        vertices[indices[faceIndex * 3] * 3 + 2]
      );
      const b = new THREE.Vector3(
        vertices[indices[faceIndex * 3 + 1] * 3],
        vertices[indices[faceIndex * 3 + 1] * 3 + 1],
        vertices[indices[faceIndex * 3 + 1] * 3 + 2]
      );
      const c = new THREE.Vector3(
        vertices[indices[faceIndex * 3 + 2] * 3],
        vertices[indices[faceIndex * 3 + 2] * 3 + 1],
        vertices[indices[faceIndex * 3 + 2] * 3 + 2]
      );

      // Générer une position aléatoire à l'intérieur du triangle
      const r1 = Math.random();
      const r2 = Math.random();
      const sqrtR1 = Math.sqrt(r1);
      const x = a.clone().multiplyScalar(1 - sqrtR1).add(b.clone().multiplyScalar(sqrtR1 * (1 - r2))).add(c.clone().multiplyScalar(sqrtR1 * r2));

      offsets.set([x.x, x.y, x.z], i * 3);
      orientations.set([0, 0, 0, 1], i * 4); // Orientation par défaut
      stretches[i] = Math.random() * 0.5 + 0.5; // Étirement aléatoire entre 0.5 et 1.0

      // Ajouter des angles de racine aléatoires
      const angle = Math.random() * Math.PI * 0.25;
      halfRootAngleSin[i] = Math.sin(angle * 0.5);
      halfRootAngleCos[i] = Math.cos(angle * 0.5);

      // Ajouter des décalages aléatoires pour le vent
      windOffsets[i] = Math.random() * 200.0;
    }

    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute('orientation', new THREE.InstancedBufferAttribute(orientations, 4));
    geometry.setAttribute('stretch', new THREE.InstancedBufferAttribute(stretches, 1));
    geometry.setAttribute('halfRootAngleSin', new THREE.InstancedBufferAttribute(halfRootAngleSin, 1));
    geometry.setAttribute('halfRootAngleCos', new THREE.InstancedBufferAttribute(halfRootAngleCos, 1));
    geometry.setAttribute('windOffset', new THREE.InstancedBufferAttribute(windOffsets, 1));

    return geometry;
  }, [baseGeometry, instances, groundMesh]);

  // Créer le matériau avec le shader
  const material = useMemo(() => {
    if (!texture || !alphaMap) return null;

    console.log("Création du matériau avec shader");

    // Créer un matériau avec les shaders
    const mat = new THREE.RawShaderMaterial({
      uniforms: {
        map: { value: texture },
        alphaMap: { value: alphaMap },
        time: { value: 0.0 },              // Initialiser le temps à 0
        windStrength: { value: windStrength },
        windFrequency: { value: windFrequency }
      },
      vertexShader: getVertexSource(bladeOptions.height),
      fragmentShader: fragmentSource,
      side: THREE.DoubleSide,
      transparent: true
    });

    // Stocker le matériau dans la ref
    materialRef.current = mat;

    return mat;
  }, [texture, alphaMap, bladeOptions.height, windStrength, windFrequency]);
  console.log("Matériau appliqué :", material);

  // Animation loop - PARTIE CRUCIALE
  useFrame((state, delta) => {
    if (materialRef.current) {
      // Incrémenter le temps et s'assurer que l'uniform est mis à jour
      timeRef.current += delta;
      // console.log("Uniforms: ", {
      //   time: materialRef.current.uniforms.time.value,
      //   windStrength: materialRef.current.uniforms.windStrength.value,
      //   windFrequency: materialRef.current.uniforms.windFrequency.value
      // });
      materialRef.current.uniforms.windStrength.value = windStrength;
      materialRef.current.uniforms.windFrequency.value = windFrequency;
      materialRef.current.uniforms.windStrength.needsUpdate = true;
      materialRef.current.uniforms.windFrequency.needsUpdate = true;
      // Mettre à jour l'uniform de temps
      materialRef.current.uniforms.time.value = timeRef.current;
      materialRef.current.uniforms.time.needsUpdate = true;

      // S'assurer que les uniforms de vent sont mis à jour
      materialRef.current.uniforms.windStrength.value = windStrength;
      materialRef.current.uniforms.windFrequency.value = windFrequency;

      // DEBUG: Afficher les valeurs pour vérifier
      // if (timeRef.current % 1 < delta) {  // Afficher environ chaque seconde
      //   console.log("Animation: ", {
      //     time: timeRef.current,
      //     windStrength: materialRef.current.uniforms.windStrength.value,
      //     windFrequency: materialRef.current.uniforms.windFrequency.value
      //   });
      // }
    }
  });

  // Mise à jour du matériau quand les props changent
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.windStrength.value = windStrength;
      materialRef.current.uniforms.windFrequency.value = windFrequency;
    }
  }, [windStrength, windFrequency]);

  return (
    <group position={position}>
      {instancedGeometry && material && (
        <instancedMesh
          ref={meshRef}
          args={[instancedGeometry, material, instances]}
          frustumCulled={false}
        />
      )}
    </group>
  );
}

Grass.propTypes = {
  bladeOptions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
    joints: PropTypes.number
  }),
  instances: PropTypes.number,
  groundModelPath: PropTypes.string,
  position: PropTypes.array,
  windStrength: PropTypes.number,
  windFrequency: PropTypes.number,
};