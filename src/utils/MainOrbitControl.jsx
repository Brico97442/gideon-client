import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { isMobile } from "react-device-detect";
import * as THREE from 'three'
const MainOrbitControl = ({ orbitControlRef, onDistanceChange }) => {
  const { camera, gl } = useThree();
  const lastDistance = useRef(null);

  useEffect(() => {
    const controls = orbitControlRef.current;
    if (!controls) return;

    if (isMobile) {
      // Activer le pan avec un seul doigt sur mobile
      controls.touches = {
        ONE: THREE.TOUCH.PAN, // Utiliser un doigt pour le pan
        TWO: THREE.TOUCH.DOLLY_ROTATE // Utiliser deux doigts pour le zoom et la rotation
      };
    } else {
      // Configuration pour les appareils non mobiles
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE, // Utiliser un doigt pour la rotation
        TWO: THREE.TOUCH.DOLLY_PAN // Utiliser deux doigts pour le zoom et le pan
      };
    }

    // Limiter les mouvements de la caméra (pan) sur l'axe X (gauche/droite)
    controls.screenSpacePanning = true; // permet de pan en espace écran
    controls.enablePan = true; // s'assure que le pan est activé

    // Limiter la translation sur l'axe X

    // Limiter la translation sur l'axe Y
    controls.maxPolarAngle = Math.PI / 2;  // limite à la verticale pour ne pas aller sous le sol

    // Ajouter un listener pour le changement de distance
    // const handleChange = () => {
    //   if (onDistanceChange) {
    //     const currentDistance = controls.getDistance();
    //     if (lastDistance.current !== null) {
    //       const distanceDiff = Math.abs(currentDistance - lastDistance.current);
    //       if (distanceDiff > 0.5) { // Seuil de détection du scroll
    //         onDistanceChange();
    //       }
    //     }
    //     lastDistance.current = currentDistance;
    //   }
    // };

    //   controls.addEventListener('change', handleChange);

    //   return () => {
    //     controls.removeEventListener('change', handleChange);
    //   };
    // }, [camera, onDistanceChange]);}
  }, [orbitControlRef])

  return (
    <OrbitControls
      ref={orbitControlRef}
      args={[camera, gl.domElement]}
      maxDistance={120}
      minDistance={8}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      panSpeed={0.6}
      // enableRotate={false} // Désactiver la rotation
      // enableZoom={true} // Activer le zoom
      // enablePan={true} // Activer le pan
    />
  );
};

export default MainOrbitControl;
