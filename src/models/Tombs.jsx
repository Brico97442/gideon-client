import React, { useState, useEffect, useMemo, useRef } from "react";
import { useGLTF, Instances, Instance } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { highlightTombSection, addOutlineToTomb } from '../utils/ColorsUtils';

const Tombs = ({ setTombClones, onTombClick, selectedTombId }) => {
  const [tombsData, setTombsData] = useState([]);
  const [selectedTomb, setSelectedTomb] = useState(null);
  const instancesRef = useRef({});
  const tombRefs = useRef({});
  const materialsRef = useRef({});
  
  // Utiliser un useRef pour stocker les niveaux LOD au lieu d'un useState
  // Cela évite les re-rendus inutiles
  const tombLODLevels = useRef({});
  
  // Utiliser le hook useThree pour accéder à la caméra
  const { camera } = useThree();
  
  // Mémoriser les modèles 3D pour éviter les rechargements
  const tombModels = useMemo(() => ({
    1: {
      low: useGLTF("/3d-models/gltf/tomb/01/01low.glb"),
      medium: useGLTF("/3d-models/gltf/tomb/01/01mid.glb"),
      high: useGLTF("/3d-models/gltf/tomb/01/01high.glb"),
    },
    2: {
      low: useGLTF("/3d-models/gltf/tomb/02/02low.glb"),
      medium: useGLTF("/3d-models/gltf/tomb/02/02mid.glb"),
      high: useGLTF("/3d-models/gltf/tomb/02/02high.glb"),
    },
    3: {
      low: useGLTF("/3d-models/gltf/tomb/02/02low.glb"),
      medium: useGLTF("/3d-models/gltf/tomb/02/02mid.glb"),
      high: useGLTF("/3d-models/gltf/tomb/02/02high.glb"),
    },
    4: {
      low: useGLTF("/3d-models/gltf/tomb/02/02low.glb"),
      medium: useGLTF("/3d-models/gltf/tomb/02/02mid.glb"),
      high: useGLTF("/3d-models/gltf/tomb/02/02high.glb"),
    },
    5: {
      low: useGLTF("/3d-models/gltf/tomb/02/02low.glb"),
      medium: useGLTF("/3d-models/gltf/tomb/02/02mid.glb"),
      high: useGLTF("/3d-models/gltf/tomb/02/02high.glb"),
    },
  }), []);

  // Vérification pour s'assurer que tous les modèles sont chargés
  const hasAllModels = useMemo(() => {
    for (const type in tombModels) {
      for (const level of ['low', 'medium', 'high']) {
        if (!tombModels[type][level]) return false;
      }
    }
    return true;
  }, [tombModels]);

  // Pré-traiter les géométries et matériaux
  const tombGeometriesAndMaterials = useMemo(() => {
    const result = {};
    
    for (const [type, models] of Object.entries(tombModels)) {
      result[type] = {};
      
      for (const [lodLevel, model] of Object.entries(models)) {
        const meshes = [];
        model.scene.traverse((child) => {
          if (child.isMesh) {
            meshes.push({
              geometry: child.geometry,
              material: child.material.clone(),
              name: child.name
            });
          }
        });
        result[type][lodLevel] = meshes;
      }
    }
    
    return result;
  }, [tombModels]);

  // Regrouper les tombes par type
  const instancedTombsData = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    tombsData.forEach(tomb => {
      grouped[tomb.type].push(tomb);
    });
    return grouped;
  }, [tombsData]);

  // Fonction pour déterminer le niveau de LOD
  const getLODLevel = (distance) => {
    if (distance < 15) return 'high';
    if (distance < 30) return 'medium';
    return 'low';
  };

  // Fonction pour une transition plus douce entre les niveaux LOD
  const smoothLODTransition = (oldLevel, newLevel, distance) => {
    // Ajouter un peu d'hystérésis pour éviter les oscillations
    const transitionBuffer = 2;
    
    if (oldLevel === 'low' && newLevel === 'medium') {
      return distance < 28 ? 'medium' : 'low';
    }
    
    if (oldLevel === 'medium' && newLevel === 'low') {
      return distance > 32 ? 'low' : 'medium';
    }
    
    if (oldLevel === 'medium' && newLevel === 'high') {
      return distance < 13 ? 'high' : 'medium';
    }
    
    if (oldLevel === 'high' && newLevel === 'medium') {
      return distance > 17 ? 'medium' : 'high';
    }
    
    return newLevel;
  };

  // Utiliser useFrame au lieu de requestAnimationFrame
  // Cela s'intègre mieux avec Three.js et React
  useFrame(() => {
    if (tombsData.length === 0) return;
    
    // Mettre à jour les LOD moins fréquemment pour améliorer les performances
    if (Math.random() > 0.05) return; // Exécuter environ 5% du temps
    
    const cameraPosition = camera.position;
    const updates = {};
    let changed = false;
    
    // Mettre à jour par batch pour éviter trop de calculs
    const batchSize = Math.min(50, tombsData.length);
    const startIndex = Math.floor(Math.random() * Math.max(1, tombsData.length - batchSize));
    const batch = tombsData.slice(startIndex, startIndex + batchSize);
    
    batch.forEach(tomb => {
      const position = new THREE.Vector3(
        tomb.tombTransform.position[0],
        tomb.tombTransform.position[2],
        -tomb.tombTransform.position[1]
      );
      
      const distance = position.distanceTo(cameraPosition);
      const rawLODLevel = getLODLevel(distance);
      const currentLODLevel = tombLODLevels.current[tomb.id] || 'low';
      const newLODLevel = smoothLODTransition(currentLODLevel, rawLODLevel, distance);
      
      // Mettre à jour uniquement si le niveau LOD a changé
      if (tombLODLevels.current[tomb.id] !== newLODLevel) {
        updates[tomb.id] = newLODLevel;
        changed = true;
      }
    });
    
    if (changed) {
      // Mettre à jour les niveaux LOD
      Object.entries(updates).forEach(([id, level]) => {
        tombLODLevels.current[id] = level;
      });
      
      // Forcer le re-rendu
      setTombsData([...tombsData]);
    }
  });

  // Récupérer les données des tombes
  const fetchTombs = async () => {
    try {
      const response = await fetch(GET_TOMBS);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      
      const flattenedTombs = [];
      data.forEach((section) => {
        section.tombs.forEach((tomb) => {
          flattenedTombs.push({
            ...tomb,
            sectionId: section.id
          });
        });
      });
      
      setTombsData(flattenedTombs);

      const tombClonesArr = [];
      if (!window.tombsSystem) window.tombsSystem = {};
      window.tombsSystem.tombPositions = {};
      
      data.forEach((section) => {
        section.tombs.forEach((tomb) => {
          const tombDummy = new THREE.Object3D();
          
          const position = [
            tomb.tombTransform.position[0],
            tomb.tombTransform.position[2],
            -tomb.tombTransform.position[1]
          ];
          
          tombDummy.position.set(...position);
          tombDummy.rotation.set(
            tomb.tombTransform.rotation[0],
            tomb.tombTransform.rotation[2],
            tomb.tombTransform.rotation[1]
          );
          
          tombDummy.userData = {
            clickable: true,
            id: tomb.id,
            sectionId: section.id,
            type: tomb.type,
            isMesh: true
          };
          
          window.tombsSystem.tombPositions[tomb.id] = {
            x: position[0],
            y: position[1],
            z: position[2],
            sectionId: section.id,
            type: tomb.type
          };
          
          tombClonesArr.push(tombDummy);
        });
      });

      window.tombsSystem.tombClones = tombClonesArr;
      setTombClones(tombClonesArr);
      
      // Initialiser les niveaux LOD
      flattenedTombs.forEach(tomb => {
        // Initialiser tous les LOD à 'low' pour une première performance optimale
        tombLODLevels.current[tomb.id] = 'low';
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des tombes :", error);
    }
  };

  useEffect(() => {
    fetchTombs();
  }, []);

  // Gérer la sélection de tombe
  useEffect(() => {
    if (selectedTombId && window.tombsSystem && tombsData.length > 0) {
      setSelectedTomb(selectedTombId);
      window.tombsSystem.selectedTombId = selectedTombId;

      // Forcer le niveau LOD à 'high' pour la tombe sélectionnée
      tombLODLevels.current[selectedTombId] = 'high';

      const sectionColors = {};
      tombsData.forEach(tomb => {
        if (!sectionColors[tomb.sectionId]) {
          sectionColors[tomb.sectionId] = '#8888FF'; // Couleur bleue par défaut
        }
      });

      const tombClones = window.tombsSystem.tombClones || [];
      highlightTombSection(tombClones, selectedTombId, sectionColors);
      addOutlineToTomb(tombClones, selectedTombId);
    } else {
      setSelectedTomb(null);
    }
  }, [selectedTombId, tombsData]);

  const handleClick = (tomb) => {
    onTombClick(tomb.id);
    console.log("Clic sur la tombe:", tomb.id);
  };

  // Si les modèles ne sont pas tous chargés, retourner un groupe vide
  if (!hasAllModels) {
    return <group />;
  }

  // Mémoriser et rendre uniquement les tombes visibles
  return (
    <>
      {Object.entries(instancedTombsData).map(([type, tombs]) => (
        tombs.length > 0 && Object.entries(tombGeometriesAndMaterials[type]).map(([lodLevel, meshes]) => (
          meshes.map((meshData, meshIndex) => (
            <Instances
              key={`type-${type}-lod-${lodLevel}-mesh-${meshIndex}`}
              range={tombs.length}
              geometry={meshData.geometry}
              material={meshData.material}
              ref={ref => {
                if (ref) instancesRef.current[`${type}-${lodLevel}-${meshIndex}`] = ref;
              }}
            >
              {tombs.map((tomb, idx) => {
                // Rendre uniquement si le niveau LOD correspond
                const currentLOD = tombLODLevels.current[tomb.id] || 'low';
                if (currentLOD !== lodLevel) return null;
                
                return (
                  <Instance
                    key={`tomb-${tomb.id}-lod-${lodLevel}-mesh-${meshIndex}`}
                    ref={ref => {
                      if (ref && meshIndex === 0) {
                        if (!tombRefs.current[tomb.id]) tombRefs.current[tomb.id] = {};
                        tombRefs.current[tomb.id][lodLevel] = ref;
                        
                        ref.userData = {
                          id: tomb.id,
                          sectionId: tomb.sectionId,
                          type: tomb.type,
                          instanceId: idx,
                          lodLevel
                        };
                      }
                    }}
                    position={[
                      tomb.tombTransform.position[0],
                      tomb.tombTransform.position[2],
                      -tomb.tombTransform.position[1]
                    ]}
                    rotation={[
                      tomb.tombTransform.rotation[0],
                      tomb.tombTransform.rotation[2],
                      tomb.tombTransform.rotation[1]
                    ]}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick(tomb);
                    }}
                  />
                );
              })}
            </Instances>
          ))
        ))
      ))}
    </>
  );
};

// Préchargement des modèles 3D avant le rendu
useGLTF.preload("/3d-models/gltf/tomb/01/01low.glb");
useGLTF.preload("/3d-models/gltf/tomb/01/01mid.glb");
useGLTF.preload("/3d-models/gltf/tomb/01/01high.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02low.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02mid.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02high.glb");

export default Tombs;