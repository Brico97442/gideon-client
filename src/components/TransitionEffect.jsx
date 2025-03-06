import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PropTypes from 'prop-types';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float progress;
  uniform float time;
  varying vec2 vUv;

  // Fonction de bruit améliorée
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Fonction de distorsion améliorée
  vec2 distort(vec2 uv, float amount) {
    float noise = random(uv + time * 0.2);
    float noise2 = random(uv * 2.0 + time * 0.3);
    return uv + vec2(noise - 0.5, noise2 - 0.5) * amount;
  }

  // Fonction de scanline améliorée
  float scanline(vec2 uv) {
    float scan = sin(uv.y * 1000.0 + time * 15.0) * 0.05;
    scan += sin(uv.y * 500.0 - time * 10.0) * 0.03;
    return scan;
  }

  // Fonction de glitch améliorée
  float glitch(vec2 uv) {
    float glitchNoise = random(uv + time * 0.8);
    float glitchAmount = step(0.95, glitchNoise) * 0.2;
    glitchAmount += step(0.98, glitchNoise) * 0.4;
    return glitchAmount;
  }

  // Fonction de transition circulaire améliorée
  float circleTransition(vec2 uv, float progress) {
    float dist = length(uv - vec2(0.5));
    float circle = smoothstep(progress - 0.2, progress, dist);
    float glow = 1.0 - smoothstep(0.0, 0.3, dist - progress);
    return circle + glow * 0.5;
  }

  void main() {
    // Effet de distorsion progressif
    float distortionAmount = progress * 0.15;
    vec2 distortedUV = distort(vUv, distortionAmount);

    // Effet de scanline
    float scanlineEffect = scanline(distortedUV);

    // Effet de glitch
    float glitchEffect = glitch(distortedUV);

    // Effet de transition circulaire
    float circleAlpha = circleTransition(distortedUV, progress);

    // Effet de scanline progressif
    float scanlineProgress = smoothstep(0.0, 0.5, progress) * smoothstep(1.0, 0.5, progress);
    float scanlineAlpha = scanlineEffect * scanlineProgress;

    // Effet de glitch progressif
    float glitchProgress = smoothstep(0.2, 0.4, progress) * smoothstep(0.8, 0.6, progress);
    float glitchAlpha = glitchEffect * glitchProgress;

    // Couleur de base
    vec4 color = texture2D(tDiffuse, distortedUV);

    // Effet de distorsion des couleurs
    vec3 distortedColor = color.rgb;
    distortedColor.r = texture2D(tDiffuse, distortedUV + vec2(0.02, 0.0)).r;
    distortedColor.b = texture2D(tDiffuse, distortedUV - vec2(0.02, 0.0)).b;

    // Mélange des effets
    vec3 finalColor = mix(color.rgb, distortedColor, glitchProgress);
    finalColor += vec3(scanlineAlpha * 0.5);
    finalColor += vec3(glitchAlpha * 0.3);

    // Transition finale avec effet de fondu
    float alpha = 1.0 - circleAlpha;
    alpha *= (1.0 - scanlineProgress * 0.3);
    alpha *= (1.0 - glitchProgress * 0.2);

    // Ajout d'un effet de lueur
    float glow = 1.0 - smoothstep(0.0, 0.3, circleAlpha);
    finalColor += vec3(glow * 0.3);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function TransitionEffect({ isTransitioning, onTransitionComplete }) {
  const { gl, scene, camera } = useThree();
  const renderTarget = useRef();
  const material = useRef();
  const progress = useRef(0);
  const time = useRef(0);

  useEffect(() => {
    renderTarget.current = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
  }, []);

  useFrame(() => {
    time.current += 0.016; // Incrémenter le temps (environ 60fps)

    if (isTransitioning) {
      progress.current += 0.009; // Ralentir encore plus la transition
      if (progress.current >= 1) {
        onTransitionComplete?.();
      }
    }

    // Rendre la scène dans le renderTarget
    gl.setRenderTarget(renderTarget.current);
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    // Mettre à jour les uniforms
    if (material.current) {
      material.current.uniforms.progress.value = progress.current;
      material.current.uniforms.time.value = time.current;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          tDiffuse: { value: renderTarget.current?.texture },
          progress: { value: 0 },
          time: { value: 0 }
        }}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

TransitionEffect.propTypes = {
  isTransitioning: PropTypes.bool.isRequired,
  onTransitionComplete: PropTypes.func
}; 