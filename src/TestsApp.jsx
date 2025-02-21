import React from "react";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";
import { useState } from "react";

const TestsApp = () => {
  const [clones, setClones] = useState([]);
  const tombGLTF = useGLTF("/3d-models/gltf/tomb/tombe.gltf");

  const generateTombs = () => {
    const tombClones = [];
    for (let i = 0; i < 10; i++) {
      const tombClone = tombGLTF.scene.clone();
      tombClone.traverse((child) => {
        if (child.isMesh) {
          child.name = `Tombtest${i}`; // Nom unique pour chaque clone
          // Créer un nouveau matériau pour le clone
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
          });
        }
      });
      tombClones.push(tombClone); // Ajouter chaque clone au tableau
    }
    setClones(tombClones); // Mettre à jour l'état avec tous les clones
  };

  const changeMaterialColor = (name) => {
    clones.forEach((clone) => {
        clone.traverse((child) => {
            if (child.name === name) {
                child.material.color.set(0xff8200);
            }
        });
    });
  };

  useEffect(() => {
    generateTombs();
  }, []);

  return (
    <>
      <button onClick={() => changeMaterialColor("Tombtest0")}>MODIFIER COULEUR</button>
      <Canvas>
        <mesh castShadow receiveShadow>
          {/* <primitive object={tombGLTF.scene} /> */}
          {clones.map((clone, key) => {
            return (
                <React.Fragment key={key}>
                    <primitive object={clone} position={[key*3, 1, 1]} />
                </React.Fragment>
            )
          })}
        </mesh>
        <OrbitControls />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      </Canvas>
    </>
  );
};

export default TestsApp;
