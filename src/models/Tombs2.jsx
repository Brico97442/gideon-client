import React, { useRef, useEffect, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { focusOnObject } from "../utils/CameraUtils";
import { initColorSystem, highlightSelectedTomb, updateInstanceColors } from "../utils/ColorsUtils";
import { useModelWithDraco, preloadTombModels } from "../utils/ModelLoader";


const Tombs = ({ onTombClick, selectedTombId, orbitControlRef }) => {
  const { invalidate, camera } = useThree();
  const [tombsData, setTombsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    preloadTombModels();
  }, []);
  // Référence aux maillages instanciés
  const instancedMeshesRef = useRef({});

  // Niveaux de détail
  const lodLevels = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };

  // Seuils de distance pour les niveaux LOD
  const LOD_THRESHOLDS = {
    HIGH: 20,
    MEDIUM: 40
  };

  // État du niveau de détail actuel pour chaque type de tombe
  const [currentLODs, setCurrentLODs] = useState({
    1: lodLevels.LOW,
    2: lodLevels.LOW,
    3: lodLevels.LOW,
    4: lodLevels.LOW,
    5: lodLevels.LOW
  });

  // Surveillance des changements de position de la caméra
  const cameraPositionRef = useRef(new THREE.Vector3());
  const needsUpdate = useRef(true);

  // Charger les modèles
  const tombModels = useMemo(() => ({
    1: {
      low: useModelWithDraco("/3d-models/gltf/tomb/01/01low.glb"),
      medium: useModelWithDraco("/3d-models/gltf/tomb/01/01mid.glb"),
      high: useModelWithDraco("/3d-models/gltf/tomb/01/01high.glb"),
    },
    2: {
      low: useModelWithDraco("/3d-models/gltf/tomb/02/02low.glb"),
      medium: useModelWithDraco("/3d-models/gltf/tomb/02/02mid.glb"),
      high: useModelWithDraco("/3d-models/gltf/tomb/02/02high.glb"),
    },
    3: {
      low: useModelWithDraco("/3d-models/gltf/tomb/03/03low.glb"),
      medium: useModelWithDraco("/3d-models/gltf/tomb/03/03mid.glb"),
      high: useModelWithDraco("/3d-models/gltf/tomb/03/03high.glb"),
    },
    4: {
      low: useModelWithDraco("/3d-models/gltf/tomb/04/04low.glb"),
      medium: useModelWithDraco("/3d-models/gltf/tomb/04/04mid.glb"),
      high: useModelWithDraco("/3d-models/gltf/tomb/04/04high.glb"),
    },
    5: {
      low: useModelWithDraco("/3d-models/gltf/tomb/05/05low.glb"),
      medium: useModelWithDraco("/3d-models/gltf/tomb/05/05mid.glb"),
      high: useModelWithDraco("/3d-models/gltf/tomb/05/05high.glb"),
    },
  }), []);
  // Fonction pour récupérer les tombes depuis l'API
  useEffect(() => {
    const fetchTombs = async () => {
      try {
        const response = await fetch(GET_TOMBS);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();

        // Transformation des données pour un accès facile
        const flattenedTombs = [];
        data.forEach((section) => {
          section.tombs.forEach((tomb) => {
            flattenedTombs.push({
              ...tomb,
              sectionId: section.id,
            });
          });
        });

        setTombsData(flattenedTombs);

        // Initialiser le système global pour les tombes
        if (!window.tombsSystem) window.tombsSystem = {};
        window.tombsSystem.needsLODUpdate = true;
        window.tombsSystem.tombPositions = {};
        window.tombsSystem.camera = camera;
        window.tombsSystem.instancedMeshesRef = instancedMeshesRef.current;

        // Enregistrer les positions de tombes
        flattenedTombs.forEach(tomb => {
          window.tombsSystem.tombPositions[tomb.id] = {
            x: tomb.tombTransform.position[0],
            y: tomb.tombTransform.position[2],
            z: -tomb.tombTransform.position[1],
            sectionId: tomb.sectionId,
            type: tomb.type
          };
        });

        // Initialiser le système de couleurs
        initColorSystem(flattenedTombs);
        if (window.tombsSystem) {
          window.tombsSystem.initialized = true;
        }
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des tombes:", error);
        setLoading(false);
      }
    };

    fetchTombs();
  }, [camera]);

  // Nouvelle fonction pour calculer la distance entre la caméra et une tombe
  const calculateDistanceToTomb = (tombPosition) => {
    const cameraPosition = camera.position;
    return Math.sqrt(
      Math.pow(cameraPosition.x - tombPosition.x, 2) +
      Math.pow(cameraPosition.y - tombPosition.y, 2) +
      Math.pow(cameraPosition.z - tombPosition.z, 2)
    );
  };

  // Fonction pour déterminer le niveau de détail en fonction de la distance
  const determineLOD = (distance) => {
    if (distance < LOD_THRESHOLDS.HIGH) {
      return lodLevels.HIGH;
    } else if (distance < LOD_THRESHOLDS.MEDIUM) {
      return lodLevels.MEDIUM;
    } else {
      return lodLevels.LOW;
    }
  };

  // Mise à jour du LOD pour chaque type de tombe
  const updateLODs = () => {
    if (!window.tombsSystem || !window.tombsSystem.tombPositions) return false;

    // Créer un objet pour stocker le LOD de chaque tombe
    if (!window.tombsSystem.tombLODs) {
      window.tombsSystem.tombLODs = {};
    }

    // Parcourir toutes les tombes
    let hasChanged = false;
    Object.entries(window.tombsSystem.tombPositions).forEach(([tombId, position]) => {
      // Calculer la distance pour cette tombe spécifique
      const distance = calculateDistanceToTomb(position);

      // Déterminer le LOD pour cette tombe
      const lod = determineLOD(distance);

      // Stocker le LOD pour cette tombe
      if (window.tombsSystem.tombLODs[tombId] !== lod) {
        window.tombsSystem.tombLODs[tombId] = lod;
        hasChanged = true;
      }
    });

    // Mettre à jour l'état des LODs
    if (hasChanged) {
      // Déterminer le LOD le plus élevé pour chaque type de tombe
      const newLODs = { ...currentLODs };

      // Regrouper les tombes par type
      const tombsByType = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      Object.entries(window.tombsSystem.tombPositions).forEach(([tombId, position]) => {
        if (tombsByType[position.type]) {
          tombsByType[position.type].push({
            id: tombId,
            lod: window.tombsSystem.tombLODs[tombId]
          });
        }
      });

      // Pour chaque type, déterminer le LOD le plus élevé à utiliser
      Object.entries(tombsByType).forEach(([type, tombs]) => {
        if (tombs.length === 0) return;

        // Priorité : HIGH > MEDIUM > LOW
        const hasHigh = tombs.some(tomb => tomb.lod === lodLevels.HIGH);
        const hasMedium = tombs.some(tomb => tomb.lod === lodLevels.MEDIUM);

        let bestLOD;
        if (hasHigh) {
          bestLOD = lodLevels.HIGH;
        } else if (hasMedium) {
          bestLOD = lodLevels.MEDIUM;
        } else {
          bestLOD = lodLevels.LOW;
        }

        if (newLODs[type] !== bestLOD) {
          newLODs[type] = bestLOD;
        }
      });

      setCurrentLODs(newLODs);
    }

    return hasChanged;
  };

  // Vérifier si une mise à jour LOD est nécessaire
  useFrame(() => {
    // Vérifier si la caméra a bougé significativement
    if (camera.position.distanceToSquared(cameraPositionRef.current) > 1) {
      cameraPositionRef.current.copy(camera.position);
      needsUpdate.current = true;
    }

    // Mettre à jour le LOD si nécessaire
    if (needsUpdate.current || (window.tombsSystem && window.tombsSystem.needsLODUpdate)) {
      const changed = updateLODs();

      // Forcer un rafraîchissement du rendu si le LOD a changé
      if (changed) {
        setRefresh(prev => prev + 1);
      }

      needsUpdate.current = false;
      if (window.tombsSystem) {
        window.tombsSystem.needsLODUpdate = false;
      }
    }
  });

  // Effet pour mettre à jour la couleur de la tombe sélectionnée

  useEffect(() => {
    if (!selectedTombId || !tombsData.length) return;

    highlightSelectedTomb(selectedTombId);

  }, [selectedTombId, tombsData]);
  
  // Mise à jour des InstancedMesh en fonction du LOD
  useEffect(() => {
    if (loading || tombsData.length === 0) return;

    // Grouper les tombes par type
    const tombsByType = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: []
    };

    tombsData.forEach(tomb => {
      if (tombsByType[tomb.type]) {
        tombsByType[tomb.type].push(tomb);
      }
    });

    // Mettre à jour la référence aux tombes groupées dans le système global
    if (window.tombsSystem) {
      window.tombsSystem.tombsByType = tombsByType;
    }

    // Mise à jour des maillages instanciés pour chaque type
    Object.keys(tombsByType).forEach(type => {
      const tombs = tombsByType[type];
      const mesh = instancedMeshesRef.current[type];
      if (!mesh || tombs.length === 0) return;

      // Obtenir le LOD spécifique pour ce type de tombe
      const lodLevel = currentLODs[type];

      // Obtenir le modèle 3D pour le niveau de détail actuel
      const model = tombModels[type][lodLevel];
      if (!model) return;

      // Extraire la géométrie et le matériau
      let geometry, material;
      model.scene.traverse(child => {
        if (child.isMesh) {
          geometry = child.geometry;
          material = child.material.clone();
        
         }
      });

      if (!geometry || !material) return;

      // Mettre à jour la géométrie et le matériau
      mesh.geometry = geometry;
      mesh.material = material;

      // Positionner chaque instance
      tombs.forEach((tomb, index) => {
        const matrix = new THREE.Matrix4();

        const position = new THREE.Vector3(
          tomb.tombTransform.position[0],
          tomb.tombTransform.position[2],
          -tomb.tombTransform.position[1]
        );

        const quaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            tomb.tombTransform.rotation[0],
            tomb.tombTransform.rotation[2],
            tomb.tombTransform.rotation[1]
          )
        );
        window.tombsSystem.tombPositions[tomb.id] = {
          x: tomb.tombTransform.position[0],
          y: tomb.tombTransform.position[2],
          z: -tomb.tombTransform.position[1],
          sectionId: tomb.sectionId,
          type: tomb.type,
          quaternion: quaternion // Stocker le quaternion
        };
        const scale = new THREE.Vector3(1, 1, 1);

        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });

      // Mettre à jour la matrice d'instance
      mesh.instanceMatrix.needsUpdate = true;
    });

    // Mettre à jour les couleurs des instances après le changement de LOD
    if (window.tombsSystem) {
      window.tombsSystem.instancedMeshesRef = instancedMeshesRef.current;
      updateInstanceColors();
    }

  }, [tombsData, loading, currentLODs, refresh, tombModels]);

  // Fonction pour gérer le clic sur une tombe
  const handleTombClick = (event) => {
    if (!onTombClick) return;

    event.stopPropagation();
    const instanceId = event.instanceId;
    const tombType = event.object.userData.type;

    // Trouver la tombe correspondante par son type et instanceId
    const tombs = tombsData.filter(tomb => tomb.type === Number(tombType));

    if (tombs[instanceId]) {
      const tomb = tombs[instanceId];
      onTombClick(tomb.id);
      focusOnObject(tomb.id);
    }
  };

  // Exposer la méthode forceLODUpdate au système global
  useEffect(() => {
    if (window.tombsSystem) {
      window.tombsSystem.forceLODUpdate = () => {
        needsUpdate.current = true;
      };
    }

    return () => {
      if (window.tombsSystem) {
        window.tombsSystem.forceLODUpdate = undefined;
      }
    };
  }, []);

  if (loading) {
    return <group />;
  }

  // Compter le nombre de tombes par type
  const countByType = {};
  tombsData.forEach(tomb => {
    countByType[tomb.type] = (countByType[tomb.type] || 0) + 1;
  });

  return (
    <group>
      {Object.entries(countByType).map(([type, count]) => {
        return (
          <instancedMesh
          transparent 
          frustumCulled={true}
            key={type}
            ref={(ref) => {
              instancedMeshesRef.current[type] = ref;
              // Mettre à jour la référence dans le système global
              if (window.tombsSystem) {
                window.tombsSystem.instancedMeshesRef = instancedMeshesRef.current;
              }
            }}
            args={[null, null, count]}

            onClick={(event) => {
              handleTombClick(event);
              invalidate();
              // Remplacer dolly par une méthode qui existe dans OrbitControls
              requestAnimationFrame(() => orbitControlRef.current?.update());
            }}
            userData={{ type }}
          
          />
        );
      })}
    </group>
  );
};

export default Tombs;