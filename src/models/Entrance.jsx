import React from "react";
import { useGLTF } from "@react-three/drei";


const Entrance = () => {
    const entranceGLB = useGLTF("/3d-models/gltf/entrance/entrance.glb");
    console.log(entranceGLB)
    return (
        <mesh position={[0,0,-33]} rotation={[0,3.1,0]}>
            <primitive object={entranceGLB.scene}/>
        </mesh>
    );
};

export default Entrance    
useGLTF.preload("/3d-models/gltf/entrance/entrance.glb");