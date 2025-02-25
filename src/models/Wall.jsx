import React from "react";
import { useGLTF } from "@react-three/drei";


const Wall = () => {
    const entranceGLB = useGLTF("/3d-models/gltf/cimetarylayout/wall.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={entranceGLB.scene}/>
        </mesh>
    );
};

export default Wall    
useGLTF.preload("/3d-models/gltf/cimetarylayout/wall.glb");