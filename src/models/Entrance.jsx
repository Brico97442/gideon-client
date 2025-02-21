import React from "react";
import { useGLTF } from "@react-three/drei";


const Entrance = () => {
    const entranceGLTF = useGLTF("/3d-models/gltf/entrance/entrance.gltf");
    return (
        <mesh>
            <primitive object={entranceGLTF.scene} position={[0, 0, 0]} />
        </mesh>
    );
};

export default Entrance