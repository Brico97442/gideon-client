import React, { useRef, useEffect, useState, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";

const Tombs = ({ onTombClick, selectedTombId }) => {
  const { scene, camera } = useThree();
  const [tombsData, setTombsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0); // État pour forcer le rendu

  // Références pour les InstancedMesh
  const instancedMeshesRef = useRef({});
  
  // Niveaux de détail
  const lodLevels = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };
  
  // Seuils de distance pour les niveaux LOD
  const LOD_THRESHOLDS = {
    HIGH: 15, // Utiliser le modèle haute résolution en dessous de 15 unités
    MEDIUM: 30 // Utiliser le modèle moyenne résolution entre 15 et 30 unités
  };
  
  // État du niveau de détail actuel
  const [currentLOD, setCurrentLOD] = useState(lodLevels.LOW);
  
  // Surveillance des changements de position de la caméra
  const cameraPositionRef = useRef(new THREE.Vector3());
  const needsUpdate = useRef(true);

  // Charger les modèles
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
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des tombes:", error);
        setLoading(false);
      }
    };

    fetchTombs();
  }, []);

  // Fonction pour déterminer le niveau LOD
  const updateLOD = () => {
    // Calculer la distance moyenne entre la caméra et le centre de la scène
    const distance = camera.position.length();
    
    let newLOD;
    if (distance < LOD_THRESHOLDS.HIGH) {
      newLOD = lodLevels.HIGH;
    } else if (distance < LOD_THRESHOLDS.MEDIUM) {
      newLOD = lodLevels.MEDIUM;
    } else {
      newLOD = lodLevels.LOW;
    }
    
    // Mettre à jour le LOD seulement si nécessaire
    if (newLOD !== currentLOD) {
      console.log(`Distance: ${distance.toFixed(2)}, LOD: ${newLOD}`);
      setCurrentLOD(newLOD);
      return true;
    }
    
    return false;
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
      const changed = updateLOD();
      
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
    
    // Mise à jour des maillages instanciés pour chaque type
    Object.keys(tombsByType).forEach(type => {
      const tombs = tombsByType[type];
      const mesh = instancedMeshesRef.current[type];
      if (!mesh || tombs.length === 0) return;
      
      // Obtenir le modèle 3D pour le niveau de détail actuel
      const model = tombModels[type][currentLOD];
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
        
        const scale = new THREE.Vector3(1, 1, 1);
        
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      
      // Mettre à jour la matrice d'instance
      mesh.instanceMatrix.needsUpdate = true;
    });
    
  }, [tombsData, loading, currentLOD, refresh]);

  // Fonction pour gérer le clic sur une tombe
  const handleTombClick = (event) => {
    if (!onTombClick) return;
    
    event.stopPropagation();
    const instanceId = event.instanceId;
    const tombType = event.object.userData.type;
    
    // Trouver la tombe correspondante
    const tombs = tombsData.filter(tomb => tomb.type === Number(tombType));
    if (tombs && tombs[instanceId]) {
      onTombClick(tombs[instanceId].id);
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
      {Object.entries(countByType).map(([type, count]) => (
        <instancedMesh
          key={type}
          ref={(ref) => (instancedMeshesRef.current[type] = ref)}
          args={[null, null, count]}
          castShadow
          receiveShadow
          onClick={handleTombClick}
          userData={{ type }}
        />
      ))}
    </group>
  );
};

export default Tombs;