import React from "react";
import { useGLTF } from "@react-three/drei";

const Ground = () => {
    const groundGLTF = useGLTF("/3d-models/gltf/ground/ground.gltf");
    return (
        <mesh>
            <primitive object={groundGLTF.scene} position={[0, 0, 0]} />
        </mesh>
    );
};

export default Ground; // Maintenant l'export se fait après la déclaration
