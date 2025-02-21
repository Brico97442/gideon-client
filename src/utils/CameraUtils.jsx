import * as THREE from "three";

export const focusOnObject = (name, tombClones, camera, orbitControlRef) => {
  tombClones.forEach((clone) => {
    clone.traverse((child) => {
      if (child.isMesh) {
        
         // stocke le matériau d'origine
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }

        // Remettre le matériau d'origine pour toutes les tombes
        child.material = child.userData.originalMaterial;

        if (child.name === name) {
          console.log("Focusing on:", child.name);
          
          // Appliquer un clone du matériau avec une nouvelle couleur
          child.material = child.material.clone();
          child.material.color.set(0xff8200); // Orange


          camera.position.set(
            child.parent.position.x - 4,
            child.parent.position.y + 3,
            child.parent.position.z - 3
          );

          // child.position.set(
          //   child.parent.position.x ,
          //   child.parent.position.y,
          //   child.parent.position.z + 3
          // )

          if (orbitControlRef.current) {
            orbitControlRef.current.target.set(
              child.parent.position.x,
              child.parent.position.y,
              child.parent.position.z
            );
          }
        }
      }
    });
  });
};
