import React, { useState, useEffect, useMemo, useRef } from "react";
import { useGLTF, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { highlightTombSection, addOutlineToTomb } from '../utils/ColorsUtils';

const Tombs = ({ setTombClones, onTombClick, selectedTombId }) => {
  const [tombsData, setTombsData] = useState([]);
  const [selectedTomb, setSelectedTomb] = useState(null);
  const instancesRef = useRef({});
  const tombRefs = useRef({});
  const materialsRef = useRef({}); // Stockage des matériaux originaux par type de tombe
  const coloredMaterialsRef = useRef({}); // Stockage des matériaux colorés

  // Utilisation de useMemo pour charger les modèles une seule fois
  const tombModels = useMemo(() => ({
    1: useGLTF("/3d-models/gltf/tomb/01lowtest.glb"),
    2: useGLTF("/3d-models/gltf/tomb/02.glb"),
    3: useGLTF("/3d-models/gltf/tomb/03.glb"),
    4: useGLTF("/3d-models/gltf/tomb/04.glb"),
    5: useGLTF("/3d-models/gltf/tomb/05.glb"),
  }), []);

  // Organiser les données de tombes par type pour l'instanciation
  const instancedTombsData = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    tombsData.forEach(tomb => {
      grouped[tomb.type].push(tomb);
    });
    return grouped;
  }, [tombsData]);

  // Préparer les géométries et matériaux pour chaque type de tombe
  const tombGeometriesAndMaterials = useMemo(() => {
    const result = {};
    
    for (const [type, model] of Object.entries(tombModels)) {
      const meshes = [];
      model.scene.traverse((child) => {
        if (child.isMesh) {
          // Stocker chaque mesh avec sa géométrie et son matériau original
          const material = child.material.clone();
          materialsRef.current[`${type}-${child.name}`] = material.clone();
          
          meshes.push({
            geometry: child.geometry,
            material: material,
            name: child.name
          });
        }
      });
      result[type] = meshes;
    }
    
    return result;
  }, [tombModels]);

  // Chargement des tombes depuis l'API
  const fetchTombs = async () => {
    try {
      const response = await fetch(GET_TOMBS);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      
      // Transformer les données pour qu'elles soient plus faciles à utiliser
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
      
      // Créer un tableau pour le passage à setTombClones
      const tombClonesArr = [];
      
      // Créer aussi un objet global pour stocker les positions de toutes les tombes
      if (!window.tombsSystem) window.tombsSystem = {};
      window.tombsSystem.tombPositions = {};
      
      data.forEach((section) => {
        section.tombs.forEach((tomb) => {
          const tombDummy = new THREE.Object3D();
          
          // Appliquer les transformations
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
          
          // Conserver toutes les données importantes pour les fonctions de caméra
          tombDummy.userData = {
            clickable: true,
            id: tomb.id,
            sectionId: section.id,
            type: tomb.type,
            isMesh: true
          };
          
          // Stocker la position globalement
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
      
      // Stocker les clones pour référence globale
      window.tombsSystem.tombClones = tombClonesArr;
      setTombClones(tombClonesArr);
    } catch (error) {
      console.error("Erreur lors de la récupération des tombes :", error);
    }
  };

  useEffect(() => {
    fetchTombs();
  }, []);

  // Mettre à jour la tombe sélectionnée quand selectedTombId change
  useEffect(() => {
    if (selectedTombId && window.tombsSystem && tombsData.length > 0) {
      setSelectedTomb(selectedTombId);
      
      // Notifier les fonctions qui ont besoin de savoir quelle tombe est sélectionnée
      window.tombsSystem.selectedTombId = selectedTombId;
      
      // Définir les couleurs des sections
      const sectionColors = {};
      // Remplir l'objet avec les IDs de section comme clés et les couleurs comme valeurs
      tombsData.forEach(tomb => {
        if (!sectionColors[tomb.sectionId]) {
          sectionColors[tomb.sectionId] = '#8888FF'; // Couleur bleue pour les sections
        }
      });
      
      // Utiliser les fonctions de ColorsUtils pour la coloration et l'outline
      const tombClones = window.tombsSystem.tombClones || [];
      highlightTombSection(tombClones, selectedTombId, sectionColors);
      addOutlineToTomb(tombClones, selectedTombId);
    } else {
      setSelectedTomb(null);
    }
  }, [selectedTombId, tombsData]);

  const handleClick = (tomb) => {
    onTombClick(tomb.id);
    console.log("Clic sur la tombe:", tomb);
  };

  return (
    <>
      {/* Créer des instances pour chaque type de tombe */}
      {Object.entries(instancedTombsData).map(([type, tombs]) => (
        tombs.length > 0 && tombGeometriesAndMaterials[type]?.map((meshData, meshIndex) => (
          <Instances
            key={`type-${type}-mesh-${meshIndex}`}
            range={tombs.length}
            geometry={meshData.geometry}
            material={meshData.material}
            ref={ref => {
              if (ref) {
                instancesRef.current[`${type}-${meshIndex}`] = ref;
                ref.name = meshData.name;
              }
            }}
          >
            {tombs.map((tomb, idx) => (
              <Instance
                key={`tomb-${tomb.id}-mesh-${meshIndex}`}
                ref={ref => {
                  if (ref && meshIndex === 0) { // Stocker seulement une référence par tombe
                    tombRefs.current[tomb.id] = ref;
                    
                    // Ajouter les données importantes aux références
                    if (ref) {
                      ref.userData = {
                        id: tomb.id,
                        sectionId: tomb.sectionId,
                        type: tomb.type,
                        instanceId: idx
                      };
                    }
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
            ))}
          </Instances>
        ))
      ))}
    </>
  );
};

// Préchargement

// Préchargement des modèles 3D avant le rendu
useGLTF.preload("/3d-models/gltf/tomb/01.glb");
useGLTF.preload("/3d-models/gltf/tomb/02.glb");
useGLTF.preload("/3d-models/gltf/tomb/03.glb");
useGLTF.preload("/3d-models/gltf/tomb/04.glb");
useGLTF.preload("/3d-models/gltf/tomb/05.glb");

export default Tombs;