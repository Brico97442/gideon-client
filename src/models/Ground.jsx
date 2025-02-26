import React from "react";
import { useGLTF } from "@react-three/drei";


const Ground = () => {
    const groundGLB = useGLTF("/3d-models/gltf/cimetarylayout/ground.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={groundGLB.scene}/>
        </mesh>
    );
};

export default Ground    
useGLTF.preload("/3d-models/gltf/cimetarylayout/ground.glb");