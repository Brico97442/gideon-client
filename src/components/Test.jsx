import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { Instances, Instance, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const Test = ({ count }) => {
  const positions = Array.from({ length: count }, (_, i) => {
    const x = (i % 50) * 2;
    const z = Math.floor(i / 50) * 2;
    return [x, 0, z];
  });

  return (
    <Instances limit={count} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="gray" />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  );
};

export default Test;