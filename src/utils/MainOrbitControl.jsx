import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

const MainOrbitControl = ({ orbitControlRef }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const controls = orbitControlRef.current;
    if (!controls) return;

    // Limiter les mouvements de la caméra (pan) sur l'axe X (gauche/droite)
    controls.screenSpacePanning = true; // permet de pan en espace écran
    controls.enablePan = true; // s'assure que le pan est activé

    // Limiter la translation sur l'axe X
    
    // Limiter la translation sur l'axe Y
    controls.maxPolarAngle = Math.PI / 2;  // limite à la verticale pour ne pas aller sous le sol

  }, [camera]);

  return (
    <OrbitControls
      ref={orbitControlRef}
      args={[camera, gl.domElement]}
      maxDistance={70}
      minDistance={8}
      enableDamping
      dampingFactor={0.2}
      rotateSpeed={0.5}
      panSpeed={0.5}
    />
  );
};

export default MainOrbitControl;
