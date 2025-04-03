import React, { useRef, useEffect, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { focusOnObject } from "../utils/CameraUtils";
import { initColorSystem, highlightSelectedTomb, updateInstanceColors } from "../utils/ColorsUtils";
import { useModelWithDraco, preloadTombModels } from "../utils/ModelLoader";

// Objets réutilisables pour les calculs
const reusableVector = new THREE.Vector3();
const reusableQuaternion = new THREE.Quaternion();
const reusableEuler = new THREE.Euler();
const reusableScale = new THREE.Vector3(1, 1, 1);
const reusableMatrix = new THREE.Matrix4();

// Créer un pool de matrices pour réduire les allocations
const createMatrixPool = (size) => {
  const pool = [];
  for (let i = 0; i < size; i++) {
    pool.push(new THREE.Matrix4());
  }
  return pool;
};

const Tombs = ({ onTombClick, selectedTombId, orbitControlRef }) => {
  console.log("🛠 onTombClick received in Tombs:", onTombClick);

  const { invalidate, camera } = useThree();
  const [tombsData, setTombsData] = useState([]);
  const [tombsMap, setTombsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const frameCount = useRef(0);

  // Créer un pool de matrices une seule fois
  const matrixPool = useMemo(() => createMatrixPool(1000), []);

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
  const lastUpdateTime = useRef(0);

  // Charger les modèles avec priorité
  const loadModelWithPriority = (path, priority) => {
    return useModelWithDraco(path, { priority });
  };

  // Charger les modèles avec priorité (basse résolution d'abord)
  const tombModels = useMemo(() => ({
    1: {
      low: loadModelWithPriority("/3d-models/gltf/tomb/01/01low.glb", "high"),
      medium: loadModelWithPriority("/3d-models/gltf/tomb/01/01mid.glb", "medium"),
      high: loadModelWithPriority("/3d-models/gltf/tomb/01/01high.glb", "low"),
    },
    2: {
      low: loadModelWithPriority("/3d-models/gltf/tomb/02/02low.glb", "high"),
      medium: loadModelWithPriority("/3d-models/gltf/tomb/02/02mid.glb", "medium"),
      high: loadModelWithPriority("/3d-models/gltf/tomb/02/02high.glb", "low"),
    },
    3: {
      low: loadModelWithPriority("/3d-models/gltf/tomb/03/03low.glb", "high"),
      medium: loadModelWithPriority("/3d-models/gltf/tomb/03/03mid.glb", "medium"),
      high: loadModelWithPriority("/3d-models/gltf/tomb/03/03high.glb", "low"),
    },
    4: {
      low: loadModelWithPriority("/3d-models/gltf/tomb/04/04low.glb", "high"),
      medium: loadModelWithPriority("/3d-models/gltf/tomb/04/04mid.glb", "medium"),
      high: loadModelWithPriority("/3d-models/gltf/tomb/04/04high.glb", "low"),
    },
    5: {
      low: loadModelWithPriority("/3d-models/gltf/tomb/05/05low.glb", "high"),
      medium: loadModelWithPriority("/3d-models/gltf/tomb/05/05mid.glb", "medium"),
      high: loadModelWithPriority("/3d-models/gltf/tomb/05/05high.glb", "low"),
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

        // Créer une Map pour un accès O(1)
        const newTombsMap = new Map();
        flattenedTombs.forEach(tomb => {
          newTombsMap.set(tomb.id, tomb);
        });

        // Mise à jour groupée des états
        setTombsData(flattenedTombs);
        setTombsMap(newTombsMap);

        // Initialiser le système global pour les tombes
        if (!window.tombsSystem) window.tombsSystem = {};
        window.tombsSystem.needsLODUpdate = true;
        window.tombsSystem.tombPositions = {};
        window.tombsSystem.camera = camera;
        window.tombsSystem.orbitControlRef = orbitControlRef;
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
        initLocalColorSystem(flattenedTombs);
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

  // Optimisation: Fonction pour calculer la distance entre la caméra et une tombe
  // Utilise un vecteur réutilisable au lieu d'en créer un nouveau
  const calculateDistanceToTomb = (tombPosition) => {
    reusableVector.set(
      camera.position.x - tombPosition.x,
      camera.position.y - tombPosition.y,
      camera.position.z - tombPosition.z
    );
    return reusableVector.length();
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

  // Optimisation: Implémentation de frustum culling
  const optimizeFrustumCulling = () => {
    if (!window.tombsSystem || !window.tombsSystem.tombPositions) return;

    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();

    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );

    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Vérifier quelles tombes sont visibles
    if (!window.tombsSystem.visibilityMap) window.tombsSystem.visibilityMap = {};

    Object.entries(window.tombsSystem.tombPositions).forEach(([tombId, position]) => {
      reusableVector.set(position.x, position.y, position.z);
      const isVisible = frustum.containsPoint(reusableVector);
      window.tombsSystem.visibilityMap[tombId] = isVisible;
    });
  };

  // Mise à jour du LOD pour chaque tombe individuellement - optimisé
  const updateLODs = () => {
    if (!window.tombsSystem || !window.tombsSystem.tombPositions) return false;

    let hasChanged = false;
    const newLODs = { ...currentLODs };

    // Mettre à jour le frustum culling
    optimizeFrustumCulling();

    // Parcourir toutes les tombes
    Object.entries(window.tombsSystem.tombPositions).forEach(([tombId, position]) => {
      // Ignorer les tombes hors du frustum
      if (window.tombsSystem.visibilityMap && !window.tombsSystem.visibilityMap[tombId]) {
        // Définir LOD le plus bas pour les tombes non visibles
        if (newLODs[tombId] !== lodLevels.LOW) {
          newLODs[tombId] = lodLevels.LOW;
          hasChanged = true;
        }
        return;
      }

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

  // Optimisation: Vérifier si une mise à jour LOD est nécessaire moins souvent
  useFrame(() => {
    // N'évaluer que tous les 5 frames pour réduire la charge
    frameCount.current = (frameCount.current + 1) % 5;
    if (frameCount.current !== 0) {
      return;
    }

    // Limiter la fréquence des mises à jour (pas plus d'une fois toutes les 200ms)
    const now = performance.now();
    if (now - lastUpdateTime.current < 200 && !needsUpdate.current) {
      return;
    }

    // Vérifier si la caméra a bougé significativement (seuil augmenté)
    if (camera.position.distanceToSquared(cameraPositionRef.current) > 4) {
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

      lastUpdateTime.current = now;
    }
  });

  // Effet pour mettre à jour la couleur de la tombe sélectionnée
  useEffect(() => {
    if (!selectedTombId || !tombsData.length || !window.tombsSystem || !window.tombsSystem.initialized) return;

    // Utiliser la fonction depuis ColorsUtils
    highlightLocalTomb(selectedTombId);

  }, [selectedTombId, tombsData]);

  // Optimisation: Créer des groupes séparés pour chaque niveau de LOD
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

      // Ignorer les tombes hors du frustum
      if (window.tombsSystem?.visibilityMap && !window.tombsSystem.visibilityMap[tomb.id]) {
        // Ajouter seulement au groupe LOW s'ils sont hors du frustum
        tombsByTypeLOD[tomb.type].low.push(tomb);
        return;
      }

      if (tombsByTypeLOD[tomb.type]) {
        tombsByTypeLOD[tomb.type][lod].push(tomb);
      }
    });

    return tombsByTypeLOD;
  };

  // Optimisation: Création des groupes de LOD avec une dépendance plus stricte
  const tombsByTypeLOD = useMemo(() => createLODGroups(),
    [tombsData.length,
    // Vérification plus efficace pour les changements de LOD
    Object.keys(currentLODs).length,
      refresh
    ]);

  // Optimisation: Batch processing pour les mises à jour d'instancedMesh
  const batchUpdateInstancedMeshes = (entries) => {
    if (loading || tombsData.length === 0) return;

    // File de mises à jour à appliquer en batch
    const updates = [];

    entries.forEach(([type, lodGroups]) => {
      Object.entries(lodGroups).forEach(([lod, tombs]) => {
        const key = `${type}_${lod}`;
        const mesh = instancedMeshesRef.current[key];

        if (!mesh || tombs.length === 0) return;

        updates.push({ key, mesh, tombs, type, lod });
      });
    });

    // Traitement des mises à jour en un seul lot
    if (updates.length > 0) {
      requestAnimationFrame(() => {
        updates.forEach(({ key, mesh, tombs, type, lod }) => {
          // Créer les matrices de transformation
          const matrices = [];
          const colors = [];
          const instanceMap = {};
          let matrixIndex = 0;

          tombs.forEach((tomb, index) => {
            // Stocker l'index de l'instance pour cette tombe
            instanceMap[tomb.id] = index;

            // Position et rotation - utiliser des objets réutilisables
            reusableVector.set(
              tomb.tombTransform.position[0],
              tomb.tombTransform.position[2],
              -tomb.tombTransform.position[1]
            );

            reusableEuler.set(
              tomb.tombTransform.rotation[0],
              tomb.tombTransform.rotation[2],
              tomb.tombTransform.rotation[1]
            );

            reusableQuaternion.setFromEuler(reusableEuler);

            // Utiliser une matrice du pool au lieu d'en créer une nouvelle
            const matrix = matrixPool[matrixIndex++];
            matrix.compose(reusableVector, reusableQuaternion, reusableScale);
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
                if (!mesh.geometry || mesh.geometry !== child.geometry) {
                  mesh.geometry = child.geometry;
                }
                if (!mesh.material || mesh.material !== child.material) {
                  mesh.material = child.material.clone();
                }
              }
            });
          }
        });

        // Forcer une seule mise à jour pour toutes les mises à jour
        invalidate();
      });
    }
  };

  // Effet pour mettre à jour les maillages instanciés - optimisé avec batch processing
  useEffect(() => {
    if (loading || tombsData.length === 0) return;

    // Mettre à jour la référence globale aux maillages instanciés

    // Mettre à jour la référence globale aux maillages instanciés
    if (window.tombsSystem) {
      window.tombsSystem.instancedMeshesRef = instancedMeshesRef.current;
      window.tombsSystem.tombInstanceMap = {};
    }

    // Appliquer les mises à jour en batch
    batchUpdateInstancedMeshes(Object.entries(tombsByTypeLOD));

    // Initialiser les tampons de couleur après la création des instances
    createColorBuffers();

    // Appliquer les mises à jour en batch
    // Mise à jour pour le système de couleurs
    if (window.tombsSystem) {
      window.tombsSystem.tombsByTypeLOD = tombsByTypeLOD;
    }

  }, [tombsByTypeLOD, tombModels, loading]);

  const initLocalColorSystem = (tombsData) => {
    if (!window.tombsSystem) window.tombsSystem = {};

    // Créer les objets pour stocker les couleurs
    window.tombsSystem.instanceColors = {};
    window.tombsSystem.originalColors = {};

    // Attribuer des couleurs par défaut à toutes les tombes
    tombsData.forEach(tomb => {
      window.tombsSystem.instanceColors[tomb.id] = new THREE.Color(0xCCCCCC);
      window.tombsSystem.originalColors[tomb.id] = new THREE.Color(0xCCCCCC);
    });

    console.log("🎨 Color system initialized with", Object.keys(window.tombsSystem.instanceColors).length, "tombs");
  };

  // Fonction pour mettre à jour les couleurs d'une tombe spécifique
  const updateTombColor = (tombId, color) => {
    if (!window.tombsSystem || !window.tombsSystem.instanceColors) {
      console.error("❌ Color system not initialized");
      return;
    }

    // Sauvegarder la couleur originale si ce n'est pas déjà fait
    if (!window.tombsSystem.originalColors[tombId] && window.tombsSystem.instanceColors[tombId]) {
      window.tombsSystem.originalColors[tombId] = window.tombsSystem.instanceColors[tombId].clone();
    }

    // Appliquer la nouvelle couleur
    window.tombsSystem.instanceColors[tombId] = color;

    // Mettre à jour tous les maillages instanciés qui contiennent cette tombe
    if (window.tombsSystem.instancedMeshesRef && window.tombsSystem.tombInstanceMap) {
      Object.entries(window.tombsSystem.tombInstanceMap).forEach(([key, instanceMap]) => {
        const mesh = window.tombsSystem.instancedMeshesRef[key];
        const instanceId = instanceMap[tombId];

        if (mesh && instanceId !== undefined && mesh.instanceColor) {
          // Mettre à jour la couleur dans le buffer
          mesh.instanceColor.setXYZ(instanceId, color.r, color.g, color.b);
          mesh.instanceColor.needsUpdate = true;
        }
      });
    }

    // Forcer un rendu
    invalidate();
  };

  // Fonction pour gérer le clic sur une tombe - modifiée
  const handleTombClick = (event) => {
    if (!onTombClick) return;

    event.stopPropagation();
    const instanceId = event.instanceId;
    const meshKey = event.object.userData.key;

    console.log("🖱️ Click event:", { instanceId, meshKey });

    // Trouver la tombe correspondante via la Map
    if (window.tombsSystem?.tombInstanceMap?.[meshKey]) {
      // Trouver l'ID de la tombe en fonction de l'instanceId
      let clickedTombId = null;

      Object.entries(window.tombsSystem.tombInstanceMap[meshKey]).forEach(([tombId, index]) => {
        if (index === instanceId) {
          clickedTombId = tombId;
        }
      });

      console.log("🪦 Clicked Tomb ID:", clickedTombId);

      if (clickedTombId && tombsMap.has(clickedTombId)) {
        // Changer immédiatement la couleur
        const highlightColor = new THREE.Color(0xFF4500); // Orange-rouge vif
        updateTombColor(clickedTombId, highlightColor);

        if (onTombClick) {
          onTombClick(clickedTombId);
        } else {
          console.error("🚨 onTombClick is undefined!");
        }

        focusOnObject(clickedTombId);
      }
    }
  };

  // Fonction pour créer et initialiser les buffers de couleur pour les maillages instanciés
  const createColorBuffers = () => {
    if (!instancedMeshesRef.current || !window.tombsSystem) return;

    // console.log("🔄 Creating color buffers for all meshes");

    // Pour chaque maillage instancié
    Object.entries(instancedMeshesRef.current).forEach(([key, mesh]) => {
      if (!mesh) return;

      const count = mesh.count || 0;
      // console.log(`🎨 Creating instanceColor for ${key} with ${count} instances`);

      // Créer le tampon de couleur s'il n'existe pas encore
      if (!mesh.instanceColor) {
        // Créer le tampon de couleur
        const colorArray = new Float32Array(count * 3);

        // Remplir avec des couleurs par défaut
        for (let i = 0; i < count; i++) {
          colorArray[i * 3] = 0.8;     // r
          colorArray[i * 3 + 1] = 0.8; // g
          colorArray[i * 3 + 2] = 0.8; // b
        }

        // Créer et assigner le buffer attribute
        mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
      }

      // Appliquer les couleurs spécifiques des tombes
      if (window.tombsSystem.tombInstanceMap?.[key]) {
        const instanceMap = window.tombsSystem.tombInstanceMap[key];

        Object.entries(instanceMap).forEach(([tombId, instanceId]) => {
          if (window.tombsSystem.instanceColors?.[tombId]) {
            const color = window.tombsSystem.instanceColors[tombId];
            mesh.instanceColor.setXYZ(instanceId, color.r, color.g, color.b);
          }
        });
      }

      mesh.instanceColor.needsUpdate = true;
      // console.log(`✅ Color buffer created for ${key}`);
    });
  };

  // Fonction pour réinitialiser les couleurs des tombes
  const resetTombColors = () => {
    if (!window.tombsSystem || !window.tombsSystem.originalColors) return;

    // Restaurer toutes les couleurs originales
    Object.entries(window.tombsSystem.originalColors).forEach(([tombId, color]) => {
      if (window.tombsSystem.instanceColors) {
        window.tombsSystem.instanceColors[tombId] = color.clone();
      }
    });

    // Mettre à jour tous les maillages instanciés
    if (window.tombsSystem.instancedMeshesRef && window.tombsSystem.tombInstanceMap) {
      Object.entries(window.tombsSystem.instancedMeshesRef).forEach(([key, mesh]) => {
        if (!mesh || !mesh.instanceColor) return;

        const instanceMap = window.tombsSystem.tombInstanceMap[key];
        if (!instanceMap) return;

        let needsUpdate = false;

        Object.entries(instanceMap).forEach(([tombId, instanceId]) => {
          if (window.tombsSystem.instanceColors?.[tombId]) {
            const color = window.tombsSystem.instanceColors[tombId];
            mesh.instanceColor.setXYZ(instanceId, color.r, color.g, color.b);
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          mesh.instanceColor.needsUpdate = true;
        }
      });
    }

    // Forcer un rendu
    invalidate();
  };

  // Fonction pour mettre en évidence la tombe sélectionnée
  const highlightLocalTomb = (selectedTombId) => {
    if (!window.tombsSystem) return;

    // Réinitialiser d'abord toutes les couleurs
    resetTombColors();

    // Si une tombe est sélectionnée, la mettre en évidence
    if (selectedTombId) {
      const highlightColor = new THREE.Color(0xFF4500); // Orange-rouge vif
      updateTombColor(selectedTombId, highlightColor);
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
                // console.log("Tomb clicked:", event);
                handleTombClick(event);
                invalidate();

                // Attendre que toutes les mises à jour soient terminées avant de mettre à jour les contrôles
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