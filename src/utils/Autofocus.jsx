import React, { useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";

const Autofocus = forwardRef(({ target = [0, 0, 0], smoothTime = 0.2, selectedTomb, tombClones, isFocused, ...props }, fref) => {
  const dofRef = useRef(null);
  const hitpoint = useRef(new THREE.Vector3(...target));
  const { camera } = useThree();

  // Fonction de mise à jour du flou
  const update = useCallback((delta, updateTarget = true) => {
    if (updateTarget && dofRef.current?.target) {
      dofRef.current.target.lerp(hitpoint.current, smoothTime * delta);
    }
  }, [smoothTime]);

  // Mise à jour automatique à chaque frame
  useFrame((_, delta) => {
    update(delta);
  });

  // API pour modifier le focus dynamiquement
  useImperativeHandle(fref, () => ({
    setFocusPoint: (point) => hitpoint.current.set(...point),
  }));

  // Si aucun objet n'est sélectionné, on ne met pas de flou, sinon on applique le flou
  const applyDepthOfField = isFocused ? selectedTomb : null;

  return (
    <DepthOfField
      ref={dofRef}
      {...props}
      focalLength={0.1}
      bokehScale={5}
      height={480}
      target={applyDepthOfField} // Appliquer le flou uniquement si une tombe est sélectionnée
    />
  );
});

// export default Autofocus;
