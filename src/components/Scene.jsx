import React, { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";

import { useRef } from "react";
import Ground from "../models/Ground";
import Entrance from "../models/Entrance";
import UserInterface from "./UserInterface";
import Tombs from "../models/Tombs";
import TombModal from "./TombModal";
import { focusOnObject } from "../utils/CameraUtils";
import { useSearchParams } from "react-router-dom";
import { PI } from "three/tsl";
import ParticleSystem from './ParticlesScene'
import MainOrbitControl from '../utils/MainOrbitControl'
import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing";

function Scene() {
  const [searchParams] = useSearchParams();
  const tombNameFromURL = searchParams.get("name");
  const particleRenderTarget = useRef();

  const [tombClones, setTombClones] = useState([]);
  const [tombName, setTombName] = useState("");
  const [camera, setCamera] = useState();
  const orbitControlRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTomb, setSelectedTomb] = useState("");

  const handleFocusOnObject = (name) => {
    focusOnObject(name, tombClones, camera, orbitControlRef);
    setSelectedTomb(name);
    setIsModalOpen(true);
  };

  const handleTombClick = (name) => {
    setSelectedTomb(name);
    setIsModalOpen(true);
    focusOnObject(name, tombClones, camera, orbitControlRef);
  };

  const SceneCamera = () => {
    const { camera } = useThree();
    setCamera(camera);
  };

  useEffect(() => {
    if (tombNameFromURL && tombClones.length > 0) {
      focusOnObject(tombNameFromURL, tombClones, camera, orbitControlRef);
    }
  }, [tombNameFromURL, tombClones]);

  return (
    <>
      <div className="main">
        <UserInterface tombName={tombName} setTombName={setTombName} focusOnObject={handleFocusOnObject} />
        <div className="fixed h-full w-full">
        <div className="absolute top-0 backdrop-blur-[5px] w-full h-full z-50"></div>
        <Canvas shadows camera={{ near: 0.2, position: [-20, 20, -50] }} style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}>
          <group>
            <Float rotationIntensity={0.5} floatIntensity={8} speed={1}>
              <ParticleSystem />
            </Float>
          </group>
        </Canvas>
          </div>
        <Canvas shadows camera={{ near: 0.2, position: [-20, 20, -50] }} className="canvas-view"  >
          {/* <Ground />
          <Entrance /> */}
          {/* <EffectComposer>
              <Autofocus ref={autofocusRef} smoothTime={0.2} />
            </EffectComposer> */}
          <ambientLight intensity={2} />

          <Tombs
            setTombClones={setTombClones}
            onTombClick={handleTombClick}
          />
          <SceneCamera />

          
          {/* <color attach="background" args={["black"]} /> */}

          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} color='purple' />

          <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI}
            color='blue'
          />
          {/* <directionalLight position={[5, 5, 5]} intensity={3} /> */}
          <MainOrbitControl orbitControlRef={orbitControlRef} />

          {/* <Environment preset="city" /> */}
          {/* Ajout du Composer avec Depth of Field et autres effets */}
        </Canvas>
        <TombModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tombName={selectedTomb}
        />
      </div>
    </>
  )
}

export default Scene
