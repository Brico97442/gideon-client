import React from "react";
import { useGLTF } from "@react-three/drei";


const Pointer = () => {
    const PointerGLB = useGLTF("/3d-models/gltf/cimetarylayout/pointer.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={PointerGLB.scene}/>
        </mesh>
    );
};

export default Pointer    
useGLTF.preload("/3d-models/gltf/cimetarylayout/pointer.glb");