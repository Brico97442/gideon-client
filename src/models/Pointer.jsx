import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber"; // Assurez-vous de l'importer ici

const Pointer = () => {
    const PointerGLB = useGLTF("/3d-models/gltf/cimetarylayout/pointer.glb");
    const pointerRef = useRef();

    // Utiliser useFrame pour faire tourner l'élément en continu sur l'axe Z
    
        // useFrame(() => {
        //     if (pointerRef.current) {
        //         pointerRef.current.rotation.y += 0.01; // Augmenter la valeur pour ajuster la vitesse de rotation
        //     }
        // });

    return (
        <mesh ref={pointerRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <primitive object={PointerGLB.scene} />
        </mesh>
    );
};

export default Pointer;

useGLTF.preload("/3d-models/gltf/cimetarylayout/pointer.glb");
