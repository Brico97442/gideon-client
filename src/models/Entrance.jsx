import React from "react";
import { useGLTF } from "@react-three/drei";


const Entrance = () => {
    const entranceGLB = useGLTF("/3d-models/gltf/cimetarylayout/entrance3.glb", true, "/draco/");
    return (
        <mesh position={[-0.6,-0.3,41.8]} rotation={[0,0.03,0]} scale={1.55,1.55,1.55}>
            <primitive object={entranceGLB.scene}/>
        </mesh>
    );
};

export default Entrance    
useGLTF.preload("/3d-models/gltf/cimetarylayout/entrance3.glb", true, "/draco/");