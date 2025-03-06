import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

const MainOrbitControl = ({ orbitControlRef, onDistanceChange }) => {
  const { camera, gl } = useThree();
  const lastDistance = useRef(null);

  useEffect(() => {
    const controls = orbitControlRef.current;
    if (!controls) return;

    // Limiter les mouvements de la caméra (pan) sur l'axe X (gauche/droite)
    controls.screenSpacePanning = true; // permet de pan en espace écran
    controls.enablePan = true; // s'assure que le pan est activé

    // Limiter la translation sur l'axe X
    
    // Limiter la translation sur l'axe Y
    controls.maxPolarAngle = Math.PI / 2;  // limite à la verticale pour ne pas aller sous le sol

    // Ajouter un listener pour le changement de distance
    const handleChange = () => {
      if (onDistanceChange) {
        const currentDistance = controls.getDistance();
        if (lastDistance.current !== null) {
          const distanceDiff = Math.abs(currentDistance - lastDistance.current);
          if (distanceDiff > 0.5) { // Seuil de détection du scroll
            onDistanceChange();
          }
        }
        lastDistance.current = currentDistance;
      }
    };

    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('change', handleChange);
    };
  }, [camera, onDistanceChange]);

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
    />
  );
};

export default MainOrbitControl;
