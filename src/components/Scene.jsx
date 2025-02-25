import React, { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Text, useGLTF } from "@react-three/drei";
import { isMobile } from "react-device-detect"; // Détecte si l'appareil est mobile

import { useRef } from "react";
import Entrance from "../models/Entrance";
import Wall from "../models/Wall";
import Ground from "../models/Ground";
import UserInterface from "./UserInterface";
import Tombs from "../models/Tombs";
import TombModal from "./TombModal";
import { focusOnObject } from "../utils/CameraUtils";
import { useSearchParams } from "react-router-dom";
import { PI } from "three/tsl";
import ParticleSystem from './ParticlesScene'
import MainOrbitControl from '../utils/MainOrbitControl'
// import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing";
import playIcon from '../assets/play_arrow.svg'
import gsap from "gsap";
import { Suspense } from "react";

function Scene() {
  const [searchParams] = useSearchParams();
  const tombNameFromURL = searchParams.get("name");
  const [initialCameraPosition, setInitialCameraPosition] = useState(null); 
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

    useEffect(() => {
      if (!initialCameraPosition) {
        setInitialCameraPosition(camera.position.clone());
      }
    }, [camera]);

    return null;
  };

  const resetCameraPosition = () => {
    if (initialCameraPosition) {
      gsap.to(camera.position, {
        x: initialCameraPosition.x,
        y: initialCameraPosition.y,
        z: initialCameraPosition.z,
        duration: 1,
        ease: "power2.out",
        // onUpdate: () => {
        //   camera.lookAt(0, 0, 0);
        // },
      });


      if (orbitControlRef.current) {
        gsap.to(orbitControlRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => {
            orbitControlRef.current.update();
          },
        });
      }
    }
  };

  const handleTopView = () => {
    if (camera) {
      // Stopper toutes les animations en cours sur la caméra
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
  
      gsap.to(camera.position, {
        x: 0,
        y: 100,  // Position en haut pour la vue de dessus
        z: 0.1,  // Petit décalage pour éviter les problèmes de rendu
        duration: 1,
        ease: "power2.out",
      });
  
      // Rotation de la caméra pour aligner correctement l'entrée
      gsap.to(camera.rotation, {
        y: -Math.PI,  // Change à Math.PI si la rotation est inversée
        duration: 1,
        ease: "power2.out",
      });
  
      if (orbitControlRef.current) {
        gsap.killTweensOf(orbitControlRef.current.target);
        gsap.to(orbitControlRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1,
          ease: "power2.out",
          onUpdate: () => {
            orbitControlRef.current.update();
          },
        });
      }
    }
  };

  useEffect(() => {
    const button = document.getElementById("top-view-btn");
    if (button) {
      button.addEventListener("click", handleTopView);
    }
    // return () => {
    //   if (button) {
    //     button.removeEventListener("click", handleTopView);
    //   }
    // };
  }, [camera]);

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
            <div className={`${applicationStart ? 'hidden' : 'flex'} flex-col items-center h-full justify-center relative`}>
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
                <ambientLight intensity={1} />
                <directionalLight position={[0, 0, 0]} intensity={10} color="yellow" />

              </Float>
            </group>
          </Canvas>
        </div>

        {applicationStart &&
          <Suspense fallback={<Loading />}>
            <div>
              <UserInterface tombName={tombName} setTombName={setTombName} focusOnObject={handleFocusOnObject} />
              <Canvas shadows   camera={{ near: 0.2, position: isMobile ? [0, 800, -200] : [-20, 100, -55], rotation: [0,Math.PI, 0]}}  id="tomb-canvas" className="absolute w-full h-full top-0 left-0">
                {/* <ambientLight intensity={2} /> */}
                <Entrance />
                <Wall/>
                <Ground/> 
                {/* <Text>Vous êtes ici</Text> */}
                <Suspense fallback={<Loading />}>
                  <Tombs
                    setTombClones={setTombClones}
                    onTombClick={handleTombClick}
                  />
                </Suspense>
                <SceneCamera />

                <ambientLight intensity={Math.PI / 2} />
                {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={1} intensity={Math.PI} color='purple' /> */}
                <directionalLight position={[5, 5, 5]} intensity={2} color="white" />

                <pointLight
                  position={[-10, -10, -10]}
                  decay={0}
                  intensity={Math.PI}
                  color='blue'
                />
                <MainOrbitControl orbitControlRef={orbitControlRef} />

              </Canvas>
              <TombModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  resetCameraPosition();
                }}
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
