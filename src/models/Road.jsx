import React from "react";
import { useGLTF } from "@react-three/drei";


const Road = () => {
    const RoadGLB = useGLTF("/3d-models/gltf/cimetarylayout/road.glb");
    return (
        <mesh 
            position={[0.4,-0.1,0]} 
            rotation={[0,0,0]}
            scale={[1,1,1.012]}
        >
            <primitive object={RoadGLB.scene}/>
        </mesh>
    );
};

export default Road    
useGLTF.preload("/3d-models/gltf/cimetarylayout/road.glb");