import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const Entrance = () => {
    const entranceGLB = useGLTF("/3d-models/gltf/cimetarylayout/entrance5.glb", true, "/draco/");
    
    // useEffect(() => {
    //     entranceGLB.scene.traverse(obj => {
    //         if (obj.type === "mesh") {
    //             const newMaterial = obj.material.clone();
    //             newMaterial.side = THREE.FrontSide;
    //             obj.material = newMaterial;
    //         }
    //     });
    // }, []);

    return (
        <mesh position={[-0.6,0,41.4]} rotation={[0,0.03,0]} scale={1.55,1.55,1.55}>
            <primitive object={entranceGLB.scene}/>
        </mesh>
    );
};

export default Entrance    
useGLTF.preload("/3d-models/gltf/cimetarylayout/entrance5.glb", true,"/draco/");