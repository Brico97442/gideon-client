import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats, useGLTF } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback } from "react";
import * as THREE from "three";
import Tombs from "../models/Tombs";

function App() {
    return (
        <div id="canvas" className="w-screen h-screen" >
            <Canvas frameloop="demand" >
                <ambientLight intensity={5} />
                < directionalLight color="red" position={[0, 0, 5]} />
                <Tombs />
                < Stats />
            </Canvas>
        </div>
    );
}

export default App;