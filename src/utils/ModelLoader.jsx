import { useGLTF } from '@react-three/drei';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Configure Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });

export const preloadTombModels = () => {
  // Type 1 models
  useGLTF.preload("/3d-models/gltf/tomb/01/01low.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/01/01mid.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/01/01high.glb", dracoLoader);
  
  // Type 2 models
  useGLTF.preload("/3d-models/gltf/tomb/02/02low.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/02/02mid.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/02/02high.glb", dracoLoader);
  
  // Type 3 models
  useGLTF.preload("/3d-models/gltf/tomb/03/03low.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/03/03mid.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/03/03high.glb", dracoLoader);
  
  // Type 4 models
  useGLTF.preload("/3d-models/gltf/tomb/04/04low.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/04/04mid.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/04/04high.glb", dracoLoader);
  
  // Type 5 models
  useGLTF.preload("/3d-models/gltf/tomb/05/05low.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/05/05mid.glb", dracoLoader);
  useGLTF.preload("/3d-models/gltf/tomb/05/05high.glb", dracoLoader);
};

// Custom hook for loading models with Draco support
export const useModelWithDraco = (path) => {
  return useGLTF(path, true, dracoLoader);
};

// Export the dracoLoader for direct use if needed
export { dracoLoader };