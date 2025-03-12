// Based on https://codepen.io/al-ro/pen/jJJygQ by al-ro, but rewritten in react-three-fiber
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getVertexSource, fragmentSource } from "./Shader3";
import PropTypes from 'prop-types';

import bladeDiffuse from "../../public/textures/grass.webp";
import bladeAlpha from "../../public/textures/grassAlpha.png";

//Dimensions de Grass original
const defaultBladeOptions = {
  width: 0.3,
  height: 0.3,
  joints: 1
};

export default function Grass2({
  bladeOptions = defaultBladeOptions,
  // width est utilisé par Grass mais n'est pas nécessaire pour Grass2
  
  instances = 200000,
  // Utiliser exactement le même chemin de modèle que Grass
  groundModelPath = "/3d-models/gltf/cimetarylayout/ground.glb",
  position = [0, 0, 0],
  // Paramètres du vent plus naturels
  windStrength = 0.1,
  windFrequency = 0.8,
}) {
  // Refs pour le groupe et l'animation
  const groupRef = useRef();
  const timeRef = useRef(0);
  const debugRef = useRef({ errors: 0 });
  
  // État pour stocker le mesh du terrain
  const [groundMesh, setGroundMesh] = useState(null);

  // Chargement des textures
  const [texture, alphaMap] = useLoader(THREE.TextureLoader, [
    bladeDiffuse,
    bladeAlpha
  ]);

  // Charger le modèle 3D du sol comme dans Grass
  const { scene: groundScene } = useGLTF(groundModelPath);
  
  // Extraire le mesh du sol du modèle 3D
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

  // Géométrie de base pour un brin d'herbe
  const baseGeometry = new THREE.PlaneGeometry(
      bladeOptions.width,
      bladeOptions.height,
      1,
      bladeOptions.joints
    );
  baseGeometry.translate(0, bladeOptions.height / 2, 0);

  // ===== CRÉATION DES OBJETS =====
  useEffect(() => {
    try {
      // Ignorer si les textures ou le terrain ne sont pas chargés
      if (!texture || !alphaMap || !groundMesh || !groupRef.current) {
        return;
      }

      
      // Nettoyer le groupe
      while(groupRef.current.children.length > 0) {
        const child = groupRef.current.children[0];
        groupRef.current.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }

      // 1. Créer la géométrie instanciée exactement comme dans Grass
      const instancedGeometry = new THREE.InstancedBufferGeometry();
      instancedGeometry.index = baseGeometry.index;
      instancedGeometry.attributes.position = baseGeometry.attributes.position;
      instancedGeometry.attributes.uv = baseGeometry.attributes.uv;

      // 2. Préparer les attributs d'instance
      const offsets = new Float32Array(instances * 3);
      const orientations = new Float32Array(instances * 4);
      const stretches = new Float32Array(instances);
      const halfRootAngleSin = new Float32Array(instances);
      const halfRootAngleCos = new Float32Array(instances);
      const windOffsets = new Float32Array(instances);

      // 3. Extraire les données de géométrie du modèle de sol
      const vertices = groundMesh.geometry.attributes.position.array;
      const indices = groundMesh.geometry.index.array;
      const faceCount = indices.length / 3;

      // 4. Calculer la surface de chaque triangle
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

      // Rayon d'exclusion autour des tombes
      const exclusionRadius = 20; // Ajustez ce rayon

      // Assurez-vous que `tombs` est défini et accessible
      const tombs = []; // Remplacez par la source réelle des tombs si nécessaire

      // Distribuer les brins d'herbe en fonction des triangles
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

        // Vérifier si le brin d'herbe est trop près d'une tombe
        let isNearTomb = false;
        for (let tomb of tombs) {
          const tombPosition = new THREE.Vector3(
            tomb.tombTransform.position[0],
            tomb.tombTransform.position[2],
            -tomb.tombTransform.position[1]
          );
          if (a.distanceTo(tombPosition) < exclusionRadius) {
            isNearTomb = true;
            break;
          }
        }

        if (!isNearTomb) {
          // Générer une position aléatoire à l'intérieur du triangle
          const r1 = Math.random();
          const r2 = Math.random();
          const sqrtR1 = Math.sqrt(r1);
          const x = a.clone().multiplyScalar(1 - sqrtR1)
                   .add(b.clone().multiplyScalar(sqrtR1 * (1 - r2)))
                   .add(c.clone().multiplyScalar(sqrtR1 * r2));

          offsets.set([x.x, x.y, x.z], i * 3);
          
          // Orientation avec variation plus naturelle
          // Au lieu d'utiliser une orientation par défaut identique pour tous les brins
          // Créer un quaternion aléatoire pour chaque brin avec une légère inclinaison
          
          // 1. Nous n'utilisons plus la normale du triangle, mais uniquement des rotations aléatoires
          
          // 2. Ajouter une rotation aléatoire autour de l'axe vertical (Y)
          const randomYAngle = Math.random() * Math.PI * 2;
          const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), randomYAngle);
          
          // 3. Ajouter une légère inclinaison aléatoire (entre -15° et +15°)
          const randomTiltAngle = (Math.random() * 0.3 - 0.15); // ±15 degrés en radians
          const randomAxis = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          ).normalize();
          const tiltRotation = new THREE.Quaternion().setFromAxisAngle(randomAxis, randomTiltAngle);
          
          // 4. Combiner les rotations
          const finalRotation = new THREE.Quaternion()
            .multiplyQuaternions(yRotation, tiltRotation);

          // Stocker le quaternion
          orientations.set([
            finalRotation.x,
            finalRotation.y,
            finalRotation.z,
            finalRotation.w
          ], i * 4);
          
          // Étirement avec plus de variation
          stretches[i] = 0.7 + Math.random() * 0.6; // Entre 0.7 et 1.3
          
          // Ajouter des angles de racine aléatoires - avec plus de variation
          const angle = Math.random() * Math.PI * 0.35; // Augmenter la plage d'angles
          halfRootAngleSin[i] = Math.sin(angle * 0.5);
          halfRootAngleCos[i] = Math.cos(angle * 0.5);

          // Ajouter des décalages aléatoires pour le vent
          windOffsets[i] = Math.random() * 100.0;
        }
      }

      // 6. Définir les attributs de la géométrie instanciée
      instancedGeometry.setAttribute('offset', 
        new THREE.InstancedBufferAttribute(offsets, 3));
      instancedGeometry.setAttribute('orientation', 
        new THREE.InstancedBufferAttribute(orientations, 4));
      instancedGeometry.setAttribute('stretch', 
        new THREE.InstancedBufferAttribute(stretches, 1));
      instancedGeometry.setAttribute('halfRootAngleSin', 
        new THREE.InstancedBufferAttribute(halfRootAngleSin, 1));
      instancedGeometry.setAttribute('halfRootAngleCos', 
        new THREE.InstancedBufferAttribute(halfRootAngleCos, 1));
      instancedGeometry.setAttribute('windOffset', 
        new THREE.InstancedBufferAttribute(windOffsets, 1));

      // 7. Créer le matériau avec shader
      const grassMaterial = new THREE.RawShaderMaterial({
            uniforms: {
          time: { value: 0.0 },
              map: { value: texture },
              alphaMap: { value: alphaMap },
          windStrength: { value: windStrength },
          windFrequency: { value: windFrequency }
            },
            vertexShader: getVertexSource(bladeOptions.height),
            fragmentShader: fragmentSource,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
      });

      // 8. Créer le mesh d'herbe
      const grassMesh = new THREE.Mesh(instancedGeometry, grassMaterial);
      // Désactiver le frustum culling pour éviter la disparition des herbes
      grassMesh.frustumCulled = false;
      groupRef.current.add(grassMesh);
      
      // Suppression du clone du terrain pour éviter la plane verte décalée

      console.log("Configuration des herbes terminée");
    } catch (err) {
      debugRef.current.errors++;
      console.error("Erreur lors de la configuration des herbes:", err);
    }
  }, [texture, alphaMap, groundMesh, bladeOptions, instances, windStrength, windFrequency]);

  // Animation plus naturelle et subtile
  useFrame((_, delta) => {
    try {
      if (!groupRef.current) return;

      // Mettre à jour le temps avec une progression régulière
      timeRef.current += delta * 0.4; // Légèrement ralenti pour un effet plus naturel
      
      // Trouver le mesh d'herbe et mettre à jour son shader
      const grassMesh = groupRef.current.children.find(child => 
        child.material && child.material.type === 'RawShaderMaterial');
      
      if (grassMesh && grassMesh.material && grassMesh.material.uniforms) {
        // S'assurer que tous les uniforms sont définis
        const uniforms = grassMesh.material.uniforms;
        
        if (!uniforms.time || !uniforms.windStrength || !uniforms.windFrequency) {
          console.warn("Certains uniforms manquent dans le shader");
          return;
        }
        
        // Mise à jour des uniforms avec variation subtile pour un effet naturel
        uniforms.time.value = timeRef.current;
        
        // Légère variation du vent pour simuler des rafales naturelles
        const baseWindStrength = Math.max(0.1, windStrength);
        const baseWindFrequency = Math.max(0.1, windFrequency);
        
        // Variation subtile sur 10-20 secondes
        const windVariation = Math.sin(timeRef.current * 0.1) * 0.2 + 1.0;
        
        uniforms.windStrength.value = baseWindStrength * windVariation;
        uniforms.windFrequency.value = baseWindFrequency;
        
        // Forcer la mise à jour du matériau
        grassMesh.material.needsUpdate = true;
      }
    } catch (err) {
      if (debugRef.current.errors < 5) {
        debugRef.current.errors++;
        console.error("Erreur d'animation:", err);
      }
    }
  });

  // eslint-disable-next-line react/no-unknown-property
  return <group ref={groupRef} position={position} frustumCulled={false} />;
}

Grass2.propTypes = {
  bladeOptions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
    joints: PropTypes.number
  }),
  width: PropTypes.number,
  instances: PropTypes.number,
  groundModelPath: PropTypes.string,
  position: PropTypes.array,
  windStrength: PropTypes.number,
  windFrequency: PropTypes.number
};
