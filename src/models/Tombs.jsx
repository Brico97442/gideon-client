import React, { useState, useEffect, useMemo, useRef } from "react";
import { useGLTF, Instances, Instance } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { highlightTombSection, addOutlineToTomb } from '../utils/ColorsUtils';
import  MainOrbitControl  from '../utils/MainOrbitControl';

const Tombs = ({ setTombClones, onTombClick, selectedTombId }) => {
  const [tombsData, setTombsData] = useState([]);
  const [selectedTomb, setSelectedTomb] = useState(null);
  const instancesRef = useRef({});
  const tombRefs = useRef({});
  const cameraPositionRef = useRef(new THREE.Vector3());
  const needsLODUpdateRef = useRef(true);

  // Niveau LOD pour chaque tombe
  const tombLODLevels = useRef({});

  // Accès à la caméra
  const { camera } = useThree();

  // Définition des seuils de distance pour les niveaux LOD
  const LOD_THRESHOLDS = {
    HIGH: 10,
    MEDIUM: 30
  };

  // Modèles 3D mémorisés
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

  // Vérification des modèles
  const hasAllModels = useMemo(() => {
    for (const type in tombModels) {
      for (const level of ['low', 'medium', 'high']) {
        if (!tombModels[type][level]) return false;
      }
    }
    return true;
  }, [tombModels]);

  // Extraction des géométries et matériaux
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

  // Regroupement des tombes par type
  const instancedTombsData = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    tombsData.forEach(tomb => {
      grouped[tomb.type].push(tomb);
    });
    return grouped;
  }, [tombsData]);

  // Fonction pour déterminer le niveau LOD
  const getLODLevel = (distance) => {
    if (distance < LOD_THRESHOLDS.HIGH) return 'high';
    if (distance < LOD_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  };

  // Mise à jour des LOD lorsque la caméra bouge
  const updateLODLevels = () => {
    if (tombsData.length === 0) return;

    const cameraPosition = camera.position;
    let hasChanges = false;

    // Optimisation: échantillonnage - traiter un sous-ensemble de tombes à chaque fois

    const batchSize = 25; // Nombre de tombes à traiter par batch
    const totalTombs = tombsData.length;

    // Diviser les tombes en batches et traiter un batch différent à chaque appel
    const batchIndex = Math.floor(Math.random() * Math.max(1, Math.ceil(totalTombs / batchSize)));
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, totalTombs);

    const tombBatch = tombsData.slice(startIndex, endIndex);

    // Traiter la tombe sélectionnée en priorité si elle existe
    if (selectedTombId) {
      const selectedTombData = tombsData.find(tomb => tomb.id === selectedTombId);
      if (selectedTombData && tombLODLevels.current[selectedTombId] !== 'high') {
        tombLODLevels.current[selectedTombId] = 'high';
        hasChanges = true;
      }
    }

    // Traiter le batch courant
    tombBatch.forEach(tomb => {
      // Ignorer la tombe sélectionnée car déjà traitée
      if (tomb.id === selectedTombId) return;

      const position = new THREE.Vector3(
        tomb.tombTransform.position[0],
        tomb.tombTransform.position[2],
        -tomb.tombTransform.position[1]
      );

      const distance = position.distanceTo(cameraPosition);
      const newLODLevel = getLODLevel(distance);

      if (tombLODLevels.current[tomb.id] !== newLODLevel) {
        tombLODLevels.current[tomb.id] = newLODLevel;
        hasChanges = true;
      }
    });

    // Déclencher un re-rendu uniquement si nécessaire
    if (hasChanges) {
      setTombsData([...tombsData]);
    }

    // Réinitialiser les flags
    needsLODUpdateRef.current = false;
    if (window.tombsSystem) {
      window.tombsSystem.needsLODUpdate = false;
    }
  };

  // Vérifier si une mise à jour LOD est nécessaire
  useFrame(() => {
    // Vérifier d'abord si une mise à jour a été déclenchée par l'événement de caméra
    if (window.tombsSystem && window.tombsSystem.needsLODUpdate) {
      cameraPositionRef.current.copy(camera.position);
      updateLODLevels();
      return;
    }

    // Vérifier également si la caméra a bougé significativement
    // (filet de sécurité pour les mouvements qui ne déclenchent pas l'événement)
    if (camera.position.distanceToSquared(cameraPositionRef.current) > 0.5) {
      cameraPositionRef.current.copy(camera.position);
      needsLODUpdateRef.current = true;
    }

    // Mettre à jour les LOD si nécessaire
    if (needsLODUpdateRef.current) {
      updateLODLevels();
    }
  });

  // Récupération des données des tombes
  useEffect(() => {
    const fetchTombs = async () => {
      try {
        const response = await fetch(GET_TOMBS);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Transformation des données
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

        // Préparation des clones pour le système de détection
        const tombClonesArr = [];
        if (!window.tombsSystem) window.tombsSystem = {};
        window.tombsSystem.tombPositions = {};
        window.tombsSystem.needsLODUpdate = false; // Initialiser le flag pour les mises à jour LOD

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

        // Initialisation des niveaux LOD
        flattenedTombs.forEach(tomb => {
          tombLODLevels.current[tomb.id] = 'low';
        });

        // Force une mise à jour initiale des LOD
        cameraPositionRef.current.copy(camera.position);
        needsLODUpdateRef.current = true;
      } catch (error) {
        console.error("Erreur lors de la récupération des tombes:", error);
      }
    };

    fetchTombs();
  }, [camera]);

  // Gestion de la sélection de tombe
  useEffect(() => {
    if (selectedTombId && window.tombsSystem && tombsData.length > 0) {
      setSelectedTomb(selectedTombId);
      window.tombsSystem.selectedTombId = selectedTombId;

      // Forcer le niveau LOD élevé pour la tombe sélectionnée
      tombLODLevels.current[selectedTombId] = 'high';

      // Forcer une mise à jour
      needsLODUpdateRef.current = true;

      // Application des effets visuels sur la tombe sélectionnée
      const tombClones = window.tombsSystem.tombClones || [];
      highlightTombSection(tombClones, selectedTombId);
      addOutlineToTomb(tombClones, selectedTombId);

      // Déclencher un re-rendu
      setTombsData([...tombsData]);
    } else {
      setSelectedTomb(null);
    }
  }, [selectedTombId, tombsData]);

  // Méthode publique pour forcer une mise à jour des LOD
  // Peut être appelée depuis l'extérieur via une ref
  const forceLODUpdate = () => {
    needsLODUpdateRef.current = true;
  };

  // Exposer la méthode forceLODUpdate au système global
  useEffect(() => {
    if (window.tombsSystem) {
      window.tombsSystem.forceLODUpdate = forceLODUpdate;
    }

    return () => {
      if (window.tombsSystem) {
        window.tombsSystem.forceLODUpdate = undefined;
      }
    };
  }, []);

  // Gestion des clics
  const handleClick = (tomb) => {
    onTombClick(tomb.id);
  };

  if (!hasAllModels) {
    return <group />;
  }

  // Rendu des tombes par type et niveau LOD
  return (
    <>

      {Object.entries(instancedTombsData).map(([type, tombs]) => (
        tombs.length > 0 && (
          ['low', 'medium', 'high'].map(lodLevel => (
            tombGeometriesAndMaterials[type][lodLevel].map((meshData, meshIndex) => (

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
                  const currentLOD = tombLODLevels.current[tomb.id];
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
        )
      ))}
    </>
  );
};

// Préchargement des modèles
useGLTF.preload("/3d-models/gltf/tomb/01/01low.glb");
useGLTF.preload("/3d-models/gltf/tomb/01/01mid.glb");
useGLTF.preload("/3d-models/gltf/tomb/01/01high.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02low.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02mid.glb");
useGLTF.preload("/3d-models/gltf/tomb/02/02high.glb");

export default Tombs;