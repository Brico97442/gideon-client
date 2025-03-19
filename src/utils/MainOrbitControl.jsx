import { OrbitControls } from "@react-three/drei";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { isMobile } from "react-device-detect";
import * as THREE from 'three'

const MainOrbitControl = ({ orbitControlRef, onCameraMove }) => {
  const {invalidate, camera, gl } = useThree();

  useEffect(() => {
    const controls = orbitControlRef.current;
    if (!controls) return;

    if (isMobile) {
      controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_ROTATE
      };
    } else {
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }

    controls.screenSpacePanning = true;
    controls.enablePan = true;
    controls.maxPolarAngle = Math.PI / 2;

    // Ajouter un événement pour détecter les mouvements de caméra
    const handleChange = () => {
      if (onCameraMove) {
        onCameraMove(camera.position.clone());
      }
    };

    controls.addEventListener('change', handleChange,invalidate);

    return () => {
      if (controls) {
        controls.removeEventListener('change', handleChange,invalidate);
      }
    };
  }, [orbitControlRef, camera, onCameraMove]);

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