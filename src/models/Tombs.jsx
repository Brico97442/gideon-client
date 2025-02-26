import React, { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GET_TOMBS } from "../config/api";



const Tombs = ({ setTombClones, onTombClick,tombId }) => {

  const [tombs, setTombs] = useState([]);
  const tombsGltf = {
    1: useGLTF("/3d-models/gltf/tomb/01.glb"),
    2: useGLTF("/3d-models/gltf/tomb/02.glb"),
    3: useGLTF("/3d-models/gltf/tomb/03.glb"),
    4: useGLTF("/3d-models/gltf/tomb/04.glb"),
    5: useGLTF("/3d-models/gltf/tomb/05.glb")
  }
  // const tombTextures = {
  //   1: useTexture("/3d-models/textures/Tomb01.png"),
  //   2: useTexture("/3d-models/textures/Tomb02.png"),
  //   3: useTexture("/3d-models/textures/Tomb03.png"),
  //   4: useTexture("/3d-models/textures/Tomb04.png"),
  //   5: useTexture("/3d-models/textures/Tomb05.png"),
  // };

  // const texture = useTexture('/3d-models/textures/Baked01.png')
  // texture.flipY = false;
  // texture.encoding=THREE.sRGBEncoding



  const generateTombs = async () => {

    try {
      // console.log("Fetching tombs from:", GET_TOMBS); 
      const response = await fetch(GET_TOMBS);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // console.log("Tombs data:", data); // Debugging API response

      const tombClonesArr = []
      data.map((section) => {
        section.tombs.map((tomb) => {

          const tombClone = tombsGltf[tomb.type].scene.clone();

          tombClone.traverse((child) => {
            if (child.isMesh) {
              child.name = `${tomb.id}`;
              // child.material = new THREE.MeshStandardMaterial({
              //   map:texture,
              // })
              child.userData = {
                clickable: true,
                id: tomb.id,
                sectionId : section.id
              };
            }
          });

          tombClone.position.set(
            tomb.tombTransform.position[0],//x
            tomb.tombTransform.position[2],//y
            -tomb.tombTransform.position[1] //z
          );

          tombClone.rotation.set(
            tomb.tombTransform.rotation[0],//x
            tomb.tombTransform.rotation[2],//y
            tomb.tombTransform.rotation[1],//z
          );
          tombClonesArr.push(tombClone)
          return tombClone;
        });

      })

      setTombs(tombClonesArr);
      setTombClones(tombClonesArr);
    } catch (error) {
      console.error("Erreur lors de la récupération des tombes :", error);
    }
  };

  useEffect(() => {
    generateTombs();
  }, []);

  // console.log(tombs)

  const handleClick = (event) => {
    event.stopPropagation();
    if (event.object.userData.clickable) {
      onTombClick(event.object.name);
    }
  };

  return (
    <mesh castShadow receiveShadow onClick={handleClick}>
      {tombs.map((clone, key) => (
        <group key={key}>
          <primitive object={clone} castShadow receiveShadow/>
        </group>
      ))}
    </mesh>
  );
};

useGLTF.preload("/3d-models/gltf/tomb/01.glb")
useGLTF.preload("/3d-models/gltf/tomb/02.glb")
useGLTF.preload("/3d-models/gltf/tomb/03.glb")
useGLTF.preload("/3d-models/gltf/tomb/04.glb")
useGLTF.preload("/3d-models/gltf/tomb/05.glb")


export default Tombs;
