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
import playIcon from '../assets/play_arrow.svg'

import { Suspense } from "react";

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
  const [applicationStart, setApplicationStart] = useState(false)

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

  const Loading = () => {
    return (
      <div className="bg-amber-600 z-50 h-full w-full">Chargement de la carte en cours</div>
    )
  }
  return (
    <>
      <div className="main">
        <div className="fixed h-full w-full">
          <div className="absolute top-0 backdrop-blur-[6px] flex justify-center items-center w-full h-full z-50">
            <div className={`${applicationStart ? 'hidden':'flex'} flex-col items-center h-full justify-center relative`}>
              <h1 className="text-white tracking-[0.5em] font-bold uppercase text-2xl lg:text-[72px] w-full box-border">Gideon </h1>
              <div className="flex flex-col items-center absolute bottom-[20px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap">Lancer l'application</h2>
                <button className=" z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px]" onClick={() => setApplicationStart(prev => !prev)}>
                  <img src={playIcon} />
                </button>
              </div>
            </div>
          </div>
          <Canvas shadows camera={{ near: 0.2, position: [-20, 20, -50] }} style={{ background: "linear-gradient(to top, #155477, #7AC8D0)" }}>
            <group>
              <Float rotationIntensity={0.5} floatIntensity={8} speed={1}>
                <ParticleSystem />
                <pointLight
                  position={[0, 0, 0]}
                  decay={0}
                  intensity={8}
                  color='yellow'
                />
                <ambientLight intensity={1}/>

              </Float>
            </group>
          </Canvas>
        </div>

        {applicationStart &&
          <Suspense fallback={<Loading />}>
            <div>
              <UserInterface tombName={tombName} setTombName={setTombName} focusOnObject={handleFocusOnObject} />
              <Canvas shadows camera={{ near: 0.2, position: [-20, 20, -50] }} id="tomb-canvas" className="absolute w-full h-full top-0 left-0">
                {/* <EffectComposer>
              <Autofocus ref={autofocusRef} smoothTime={0.2} />
                </EffectComposer> */}
                <ambientLight intensity={2} />
                <Suspense fallback={<Loading />}>
                  <Tombs
                    setTombClones={setTombClones}
                    onTombClick={handleTombClick}
                  />
                </Suspense>

                <SceneCamera />


                {/* <color attach="background" args={["black"]} /> */}

                <ambientLight intensity={Math.PI / 2} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={1} intensity={Math.PI} color='purple' />
                <directionalLight position={[5, 5, 5]} intensity={3} color="green" />

                <pointLight
                  position={[-10, -10, -10]}
                  decay={0}
                  intensity={Math.PI}
                  color='blue'
                />
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
          </Suspense>
        }

      </div>
    </>
  )
}

export default Scene
