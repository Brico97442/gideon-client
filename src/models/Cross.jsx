import React from "react";
import { useGLTF } from "@react-three/drei";


const Cross = () => {
    const crossGLB = useGLTF("/3d-models/gltf/cimetarylayout/cross.glb", true, "/draco/");
    return (
        <mesh position={[-0.62,0.2,1.5]} rotation={[0,-0.05,0]} scale={[1.005,1.005,1.005]}>
            <primitive object={crossGLB.scene}/>
        </mesh>
    );
};

export default Cross    
useGLTF.preload("/3d-models/gltf/cimetarylayout/cross.glb", true, "/draco/");