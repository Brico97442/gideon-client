import React from "react";
import { useGLTF } from "@react-three/drei";


const Cross = () => {
    const crossGLB = useGLTF("/3d-models/gltf/cimetarylayout/cross.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={crossGLB.scene}/>
        </mesh>
    );
};

export default Cross    
useGLTF.preload("/3d-models/gltf/cimetarylayout/cross.glb");