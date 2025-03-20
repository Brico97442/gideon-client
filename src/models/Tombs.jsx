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

  // Seuils de distance pour les niveaux LOD (en unités)
  const LOD_THRESHOLDS = {
    HIGH: 20,    // Rayon pour le modèle haute résolution
    MEDIUM: 40   // Rayon pour le modèle moyenne résolution
  };

  // État du niveau de détail actuel pour chaque tombe
  const [currentLODs, setCurrentLODs] = useState({});

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
        window.tombsSystem.orbitControlRef = orbitControlRef; // Ajouter la référence aux contrôles d'orbite
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
  }, [camera, orbitControlRef]);

  // Fonction pour calculer la distance entre la caméra et une tombe
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

  // Mise à jour du LOD pour chaque tombe individuellement
  const updateLODs = () => {
    if (!window.tombsSystem || !window.tombsSystem.tombPositions) return false;

    let hasChanged = false;
    const newLODs = { ...currentLODs };

    // Parcourir toutes les tombes
    Object.entries(window.tombsSystem.tombPositions).forEach(([tombId, position]) => {
      const distance = calculateDistanceToTomb(position);
      const lod = determineLOD(distance);

      if (newLODs[tombId] !== lod) {
        newLODs[tombId] = lod;
        hasChanged = true;
      }
    });

    if (hasChanged) {
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

    // Utiliser la fonction depuis ColorsUtils
    highlightSelectedTomb(selectedTombId);

  }, [selectedTombId, tombsData]);

  // Créer des groupes séparés pour chaque niveau de LOD
  const createLODGroups = () => {
    if (loading || tombsData.length === 0) return {};

    // Organiser les tombes par type et par LOD
    const tombsByTypeLOD = {};
    const DEFAULT_COLOR = 0xCCCCCC;

    // Initialiser la structure
    Object.keys(tombModels).forEach(type => {
      tombsByTypeLOD[type] = {
        low: [],
        medium: [],
        high: []
      };
    });

    // Répartir les tombes par type et LOD
    tombsData.forEach(tomb => {
      const lod = currentLODs[tomb.id] || lodLevels.LOW;
      if (tombsByTypeLOD[tomb.type]) {
        tombsByTypeLOD[tomb.type][lod].push(tomb);
      }
    });

    return tombsByTypeLOD;
  };

  // Création des groupes de LOD
  const tombsByTypeLOD = useMemo(() => createLODGroups(), [tombsData, currentLODs, refresh]);

  // Effet pour mettre à jour les maillages instanciés
  useEffect(() => {
    if (loading || tombsData.length === 0) return;

    // Mettre à jour la référence globale aux maillages instanciés
    if (window.tombsSystem) {
      window.tombsSystem.instancedMeshesRef = instancedMeshesRef.current;

      // Créer une carte de correspondance entre les tombes et leurs indices dans chaque maillage
      window.tombsSystem.tombInstanceMap = {};
    }

    Object.entries(tombsByTypeLOD).forEach(([type, lodGroups]) => {
      Object.entries(lodGroups).forEach(([lod, tombs]) => {
        const key = `${type}_${lod}`;
        const mesh = instancedMeshesRef.current[key];

        if (!mesh || tombs.length === 0) return;

        // Créer les matrices de transformation
        const matrices = [];
        const colors = [];

        // Créer une carte de correspondance pour cette combinaison type_lod
        const instanceMap = {};

        tombs.forEach((tomb, index) => {
          // Stocker l'index de l'instance pour cette tombe
          instanceMap[tomb.id] = index;

          // Position et rotation
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

          const scale = new THREE.Vector3(1, 1, 1);
          const matrix = new THREE.Matrix4();
          matrix.compose(position, quaternion, scale);
          matrices.push(matrix);

          // Couleur
          const color = window.tombsSystem?.instanceColors?.[tomb.id] || new THREE.Color(0xCCCCCC);
          colors.push(color.r, color.g, color.b);
        });

        // Stocker la carte de correspondance dans le système global
        if (window.tombsSystem) {
          if (!window.tombsSystem.tombInstanceMap) {
            window.tombsSystem.tombInstanceMap = {};
          }
          window.tombsSystem.tombInstanceMap[key] = instanceMap;
        }

        // Mettre à jour le nombre d'instances
        mesh.count = matrices.length;

        // Mettre à jour les matrices d'instance
        if (matrices.length > 0) {
          // Réinitialiser l'instanceMatrix si nécessaire
          if (mesh.instanceMatrix.count !== matrices.length) {
            mesh.instanceMatrix = new THREE.InstancedBufferAttribute(
              new Float32Array(matrices.length * 16), 16
            );
          }

          // Mettre à jour chaque matrice
          for (let i = 0; i < matrices.length; i++) {
            mesh.setMatrixAt(i, matrices[i]);
          }
          mesh.instanceMatrix.needsUpdate = true;
        }

        // Mettre à jour les couleurs d'instance
        if (colors.length > 0) {
          if (!mesh.instanceColor || mesh.instanceColor.count !== tombs.length) {
            mesh.instanceColor = new THREE.InstancedBufferAttribute(
              new Float32Array(colors), 3
            );
          } else {
            for (let i = 0; i < colors.length; i++) {
              mesh.instanceColor.array[i] = colors[i];
            }
          }
          mesh.instanceColor.needsUpdate = true;
        }

        // Appliquer le modèle 3D correspondant au LOD
        const model = tombModels[type][lod];
        if (model) {
          model.scene.traverse(child => {
            if (child.isMesh) {
              mesh.geometry = child.geometry;
              mesh.material = child.material.clone();
            }
          });
        }
      });
    });

    // Mise à jour pour le système de couleurs
    if (window.tombsSystem) {
      window.tombsSystem.tombsByTypeLOD = tombsByTypeLOD;
    }

  }, [tombsByTypeLOD, tombModels, loading]);

  // Fonction pour gérer le clic sur une tombe
  const handleTombClick = (event) => {
    if (!onTombClick) return;

    event.stopPropagation();
    const instanceId = event.instanceId;
    const meshKey = event.object.userData.key;
    const [type, lod] = meshKey.split('_');

    // Trouver la tombe correspondante
    const tombs = tombsByTypeLOD[type][lod];
    if (tombs && tombs[instanceId]) {
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

  return (
    <group>
      {Object.entries(tombsByTypeLOD).map(([type, lodGroups]) => (
        Object.entries(lodGroups).map(([lod, tombs]) => {
          const key = `${type}_${lod}`;
          return tombs.length > 0 ? (
            <instancedMesh
            frustumCulled={true}
              key={key}
              ref={(ref) => {
                instancedMeshesRef.current[key] = ref;
                if (window.tombsSystem) {
                  window.tombsSystem.instancedMeshesRef = {
                    ...window.tombsSystem.instancedMeshesRef,
                    [key]: ref
                  };
                }
              }}
              args={[null, null, tombs.length]}
              onClick={(event) => {
                handleTombClick(event);
                invalidate();
                requestAnimationFrame(() => orbitControlRef.current?.update());
              }}
              userData={{ key, type, lod }}
            />
          ) : null;
        })
      ))}
    </group>
  );
};

export default Tombs;