import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats, useGLTF } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback } from "react";
import Tombs from "../models/Tombs";

import * as THREE from "three";
const Ground = () => {
    const groundGLB = useGLTF("/3d-models/gltf/cimetarylayout/ground.glb");
    return (
        <mesh 
            position={[0,-0.1,0]} 
            rotation={[0,0,0]}
        >
            <primitive object={groundGLB.scene}/>
        </mesh>
    );
};

const Cross = () => {
    const crossGLB = useGLTF("/3d-models/gltf/cimetarylayout/cross.glb");
    return (
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <primitive object={crossGLB.scene}/>
        </mesh>
    );
};

useGLTF.preload("/3d-models/gltf/cimetarylayout/cross.glb");

useGLTF.preload("/3d-models/gltf/cimetarylayout/ground.glb");
function App() {

    return (
        <div id="canvas" className="w-screen h-screen" >
            <Canvas frameloop="demand" >
                
                <ambientLight intensity={5} />
                < directionalLight color="red" position={[0, 0, 5]} />
                <Tombs />
                <Ground/>
                <Cross/>
                < Stats />
                <OrbitControls/>
            </Canvas>
        </div>
    );
}

export default App;