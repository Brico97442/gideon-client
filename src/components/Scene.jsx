import { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, SoftShadows, Text, Billboard } from "@react-three/drei";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import axios from 'axios';
import { useRef } from "react";
import Entrance from "../models/Entrance";
import Wall from "../models/Wall";
import Ground from "../models/Ground";
import UserInterface from "./UserInterface";
import Tombs from "../models/Tombs";
import TombModal from "./TombModal";
import { useSearchParams } from "react-router-dom";
import ParticleSystem from './ParticlesScene';
import MainOrbitControl from '../utils/MainOrbitControl';
import { Suspense } from "react";
import { focusOnObject, moveCameraToPosition } from "../utils/CameraUtils";
import { highlightTombSection } from "../utils/ColorsUtils";
import { GET_DECEASED } from "../config/api";
import Cross from "../models/Cross";
import { Bloom, EffectComposer, DepthOfField } from '@react-three/postprocessing';
import Pointer from "../models/Pointer";
import { useTomb } from '../context/TombContext';
import gsap from "gsap";
import playIcon from '../assets/play_arrow.svg';
import { TransitionEffect } from './TransitionEffect';

// Définition des couleurs des sections
const sectionColors = {
  13: '#EF507E',
  14: '#FFE771',
  15: '#B89AD7',
  16: '#E0C2B6',
};

function Scene() {
  const [searchParams] = useSearchParams();
  //const tombNameFromURL = searchParams.get("name");
  const [initialCameraPosition, setInitialCameraPosition] = useState(null);
  const [tombClones, setTombClones] = useState([]);
  const [camera, setCamera] = useState();
  const orbitControlRef = useRef();
  const tombId = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTomb, setSelectedTomb] = useState("");
  const [applicationStart, setApplicationStart] = useState(false)
  const { selectTomb, clearSelectedTomb, setSceneElements } = useTomb();
  const [tombDetails, setTombDetails] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const [isDepthOfFieldEnabled, setIsDepthOfFieldEnabled] = useState(false);
  const [focusedTombDistance, setFocusedTombDistance] = useState(null);

  const fetchTombDetails = async (tombId) => {
    try {
      const response = await axios.get(GET_DECEASED(tombId));
      selectTomb(tombId, response.data);
      setTombDetails(response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la tombe", error);
    }
  };

  const SceneCamera = () => {
    const { camera } = useThree();
    
    useEffect(() => {
      if (!initialCameraPosition) {
        setInitialCameraPosition(camera.position.clone());
      }
      
      // Définir l'état de la caméra
      setCamera(camera);
      
      // Initialiser les éléments de scène dans le contexte
      if (tombClones.length > 0) {
        console.log("Initialisation des éléments de scène avec", tombClones.length, "tombes");
        setSceneElements(camera, orbitControlRef, tombClones);
      }
    }, [camera, tombClones]);
  
    return null;
  };
  
  // Ajouter un useEffect pour surveiller la position de la caméra
  useEffect(() => {
    let animationFrameId;
    
    const checkCameraDistance = () => {
      if (focusedTombDistance && selectedTomb && camera) {
        const tomb = tombClones.find(t => t.name === selectedTomb);
        if (tomb) {
          const currentDistance = camera.position.distanceTo(tomb.position);
          const distanceDiff = Math.abs(currentDistance - focusedTombDistance);
          console.log("Distance actuelle:", currentDistance, "Distance initiale:", focusedTombDistance, "Différence:", distanceDiff);
          
          if (distanceDiff > 10) {
            setIsDepthOfFieldEnabled(false);
          }else if(distanceDiff<10){
            setIsDepthOfFieldEnabled(true);

          }
        }
      }
      animationFrameId = requestAnimationFrame(checkCameraDistance);
    };

    if (isDepthOfFieldEnabled) {
      animationFrameId = requestAnimationFrame(checkCameraDistance);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [focusedTombDistance, selectedTomb, camera, tombClones, isDepthOfFieldEnabled]);

  // Ajouter un useEffect pour gérer le scroll
  useEffect(() => {
    let scrollTimeout;
    let lastScrollTime = 0;
    const SCROLL_DELAY = 1000; // Délai entre chaque vérification

    const handleScroll = () => {
      const currentTime = Date.now();
      if (currentTime - lastScrollTime < SCROLL_DELAY) {
        return; // Ignorer si le délai n'est pas écoulé
      }
      lastScrollTime = currentTime;

      if (isDepthOfFieldEnabled && selectedTomb && camera) {
        const tomb = tombClones.find(t => t.name === selectedTomb);
        if (tomb) {
          const currentDistance = camera.position.distanceTo(tomb.position);
          const distanceDiff = Math.abs(currentDistance - focusedTombDistance);
          console.log("Distance actuelle:", currentDistance, "Distance initiale:", focusedTombDistance, "Différence:", distanceDiff);
          
          if (distanceDiff > 15) { // Augmenter le seuil à 15 unités
            scrollTimeout = setTimeout(() => {
              setIsDepthOfFieldEnabled(false);
            }, 10000); // Délai avant la désactivation
          }
        }
      }
    };

    const canvas = document.getElementById('tomb-canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleScroll);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleScroll);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isDepthOfFieldEnabled, selectedTomb, camera, tombClones, focusedTombDistance]);

  const handleDistanceChange = () => {
    if (isDepthOfFieldEnabled) {
      setIsDepthOfFieldEnabled(false);
    }
  };

  const handleTombClick = (id) => {
    console.log("Click sur la tombe:", id);
    setIsModalOpen(true);
    setSelectedTomb(id);
    
    if (camera && tombClones.length > 0 && orbitControlRef.current) {
      console.log("Focus sur la tombe:", id);
      focusOnObject(id, tombClones, camera, orbitControlRef, sectionColors);
      fetchTombDetails(id);
      
      // Activer le Depth of Field après un délai
      setTimeout(() => {
        setIsDepthOfFieldEnabled(true);
      }, 1000);
    } else {
      console.warn("État des dépendances:", {
        camera: !!camera,
        tombClonesLength: tombClones.length,
        orbitControlRef: !!orbitControlRef.current
      });
      fetchTombDetails(id);
    }
  };

  const handleTopView = () => {
    if (!camera) return;
    setIsDepthOfFieldEnabled(false);
    setFocusedTombDistance(null);
    const topViewPosition = { x: 0, y: 120, z: 0.001 };

    moveCameraToPosition(camera, topViewPosition, orbitControlRef, new THREE.Vector3(0, 0, 0));

    if (orbitControlRef.current) {
      gsap.to(orbitControlRef.current.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => orbitControlRef.current.update(),
      });
    }
  };

  const resetCameraPosition = () => {
    setIsDepthOfFieldEnabled(false);
    setFocusedTombDistance(null);
    if (initialCameraPosition) {
      gsap.to(camera.position, {
        x: initialCameraPosition.x,
        y: initialCameraPosition.y,
        z: initialCameraPosition.z,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        },
      });

      if (orbitControlRef.current) {
        gsap.to(orbitControlRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            orbitControlRef.current.update();
          },
        });
      }
    }
  };

  useEffect(() => {
    const savedTomb = searchParams.get("name");
    if (savedTomb && tombClones.length > 0 && camera && orbitControlRef.current) {
      //console.log("Initialisation depuis l'URL - ID de la tombe:", savedTomb);
      
      // Mettre à jour le contexte avec la tombe sélectionnée
      selectTomb(savedTomb);
      
      if (isMobile) {
        //console.log("Version mobile : uniquement surbrillance sans modal");
        highlightTombSection(tombClones, savedTomb, sectionColors);
      } else {
        //console.log("Version desktop : surbrillance + modal + focus caméra");
        setIsModalOpen(true);
        focusOnObject(savedTomb, tombClones, camera, orbitControlRef, sectionColors);
      }
      
      // Récupérer les détails de la tombe en arrière-plan
      fetchTombDetails(savedTomb);
    }
  }, [tombClones, searchParams, camera, orbitControlRef]);


  useEffect(() => {
    const button = document.getElementById("top-view-btn");
    if (button) {
      button.addEventListener("click", handleTopView);
    }
  }, [camera]);


  const Loading = () => {
    return (
      <div className="bg-amber-600 z-50 h-full w-full">Chargement de la carte en cours</div>
    )
  }

  const handleStartApplication = () => {
    setIsTransitioning(true);
    setApplicationStart(true);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    setIsSceneLoaded(true);
  };

  return (
    <>
      <div className="main">
        <div className="fixed h-full w-full" onClick={handleStartApplication}>
          <div
            className={`absolute top-0 backdrop-blur-[6px] flex justify-center items-center w-full h-full z-50`}
          >
            <div className={`${applicationStart ? 'fade-out' : 'fade-in'} flex flex-col  items-center w-full backdrop-blur-[6px] h-full justify-center relative`}>
              <h1 className="text-white tracking-[0.5em] font-bold text-center uppercase text-2xl lg:text-[72px] w-full box-border">Gideon </h1>
              <div className="flex flex-col items-center h-full justify-end absolute bottom-[60px] lg:bottom-[161px]">
                <h2 className="text-xl text-white whitespace-nowrap breath">Toucher l'écran pour commencer</h2>
                <button 
                  className="z-50 cursor-pointer rounded-full h-[72px] w-[72px] border-5 border-white flex items-center justify-center mt-[26px] breath" 
                >
                  <img src={playIcon} alt="Play" />
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
            {isTransitioning && (
              <TransitionEffect 
                isTransitioning={isTransitioning} 
                onTransitionComplete={handleTransitionComplete}
              />
            )}
          </Canvas>
        </div>

        {applicationStart && (
          <Suspense fallback={<Loading />}>
            <div>
              <div className={`flex justify-center w-full h-full relative z-50 ${isSceneLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
                <button 
                  id='top-view-btn' 
                  className="absolute cursor-pointer text-white top-6 min-w-56 lg:top-6 h-10 lg:h-[76px] w-30 rounded-lg bg-[#0E1C36]/80 hover:bg-[#0E1C36]/70 hover:text-green-300 transition-all duration-150"
                >
                  Passer en vue aérienne
                </button>
              </div>
              
              <div className={`transition-opacity duration-[1500] z-50 ${isSceneLoaded ? 'opacity-100' : 'opacity-0'}`} >
                <UserInterface handleTombClick={handleTombClick} />
              </div>
            
              <Canvas 
                shadows 
                camera={{ near: 0.2, position: isMobile ? [0, 80, 5] : [30, 50, 75], rotation: [0, Math.PI, 0] }} 
                id="tomb-canvas" 
                className={`absolute h-full w-full lg:w-[80%] top-0 left-0 ${isSceneLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
              >
              <group>
              <Billboard position={[0, 2, 52]} follow={true} lockX={false} lockY={false} lockZ={false}>
                <Text fontSize={2} color="white">
                  Vous êtes ici
                </Text>
              </Billboard>
                  <Pointer/>
                  <Entrance />
                  <Wall />
                  <Ground />
                  <Cross />
                  <ambientLight intensity={3} />
                  <Suspense fallback={null}>
                    <Tombs
                      setTombClones={setTombClones}
                      onTombClick={handleTombClick}
                    />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={1} intensity={Math.PI} color='orange' />
                  </Suspense>
                  <directionalLight position={[2, 3, -2]} intensity={0.5} />
                  <EffectComposer>
                    <SoftShadows samples={32} radius={5} intensity={55} />
                    {isDepthOfFieldEnabled && (
                      <DepthOfField
                        focusDistance={0.001}
                        focalLength={0.02}
                        bokehScale={0.8}
                        height={500}
                        target={selectedTomb ? tombClones.find(tomb => tomb.name === selectedTomb) : null}
                      />
                    )}
                  </EffectComposer>
                </group>

                <SceneCamera />
                <MainOrbitControl 
                  orbitControlRef={orbitControlRef} 
                  onDistanceChange={handleDistanceChange}
                />

                <pointLight
                  position={[-10, -10, -10]}
                  decay={1}
                  intensity={Math.PI}
                  color='yellow'
                />
              </Canvas>
              <TombModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  clearSelectedTomb();
                  resetCameraPosition();
                }}
                tombName={selectedTomb}
                tombDetails={tombDetails}
                tombId={tombId}
                onTombClick={handleTombClick}
              />
            </div>
          </Suspense>
        )}
      </div>
    </>
  );
}

export default Scene;
