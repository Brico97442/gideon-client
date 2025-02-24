import React from "react";
import { useGLTF } from "@react-three/drei";


const Entrance = () => {
    const entranceGLB = useGLTF("/3d-models/gltf/cimetarylayout/entrance.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={entranceGLB.scene}/>
        </mesh>
    );
};

export default Entrance    
useGLTF.preload("/3d-models/gltf/cimetarylayout/entrance.glb");