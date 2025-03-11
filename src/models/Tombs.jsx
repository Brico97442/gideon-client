import React, { useState, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";
import { EffectComposer, Outline } from "@react-three/postprocessing";

const Tombs = ({ setTombClones, onTombClick, selectedTombId }) => {
  const [tombs, setTombs] = useState([]);
  const [selectedTomb, setSelectedTomb] = useState(null);
  const tombsRef = useRef({});
  // console.log( selectedTomb)

  const tombsGltf = {
    1: useGLTF("/3d-models/gltf/tomb/01.glb"),
    2: useGLTF("/3d-models/gltf/tomb/02.glb"),
    3: useGLTF("/3d-models/gltf/tomb/03.glb"),
    4: useGLTF("/3d-models/gltf/tomb/04.glb"),
    5: useGLTF("/3d-models/gltf/tomb/05.glb")
  }

  const generateTombs = async () => {
    try {
      const response = await fetch(GET_TOMBS);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const tombClonesArr = []
      
      data.forEach((section) => {
        section.tombs.forEach((tomb) => {
          const tombClone = tombsGltf[tomb.type].scene.clone();

          tombClone.traverse((child) => {
            if (child.isMesh) {
              child.name = `${tomb.id}`;
              child.userData = {
                clickable: true,
                id: tomb.id,
                sectionId: section.id,
                type: tomb.type
              };
              
              // Stocker la référence de chaque tombe par ID
              tombsRef.current[tomb.id] = child;
            }
          });

          tombClone.position.set(
            tomb.tombTransform.position[0],
            tomb.tombTransform.position[2],
            -tomb.tombTransform.position[1]
          );

          tombClone.rotation.set(
            tomb.tombTransform.rotation[0],
            tomb.tombTransform.rotation[2],
            tomb.tombTransform.rotation[1],
          );
          
          tombClonesArr.push(tombClone);
        });
      });

      setTombs(tombClonesArr);
      setTombClones(tombClonesArr);
    } catch (error) {
      console.error("Erreur lors de la récupération des tombes :", error);
    }
  };

  useEffect(() => {
    generateTombs();
  }, []);

  // Mettre à jour la tombe sélectionnée quand selectedTombId change
  useEffect(() => {
    if (selectedTombId && tombsRef.current[selectedTombId]) {
      setSelectedTomb(tombsRef.current[selectedTombId]);
    } else {
      setSelectedTomb(null);
    }
  }, [selectedTombId]);

  const handleClick = (event) => {
    event.stopPropagation();
    if (event.object.userData.clickable) {
      onTombClick(event.object.userData.id);
    }
  };

  return (
    <>
      <mesh onClick={handleClick}>
        {tombs.map((clone, key) => (
          <group key={key}>
            <primitive object={clone} receiveShadow castShadow />
          </group>
        ))}
      </mesh>
    </>
  );
};

useGLTF.preload("/3d-models/gltf/tomb/01.glb");
useGLTF.preload("/3d-models/gltf/tomb/02.glb");
useGLTF.preload("/3d-models/gltf/tomb/03.glb");
useGLTF.preload("/3d-models/gltf/tomb/04.glb");
useGLTF.preload("/3d-models/gltf/tomb/05.glb");

export default Tombs;