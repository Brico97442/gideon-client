export const getVertexSource = height =>
  `
precision mediump float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute vec4 orientation;
attribute float halfRootAngleSin;
attribute float halfRootAngleCos;
attribute float stretch;
attribute float windOffset; // Attribut ajouté pour le décalage du vent
uniform float time;
uniform float windStrength;
uniform float windFrequency;
varying vec2 vUv;
varying float frc;

// Fonction de bruit Simplex améliorée pour éviter les artefacts
vec3 mod289(vec3 x) {return x - floor(x * (1.0 / 289.0)) * 289.0;} 
vec2 mod289(vec2 x) {return x - floor(x * (1.0 / 289.0)) * 289.0;} 
vec3 permute(vec3 x) {return mod289(((x*34.0)+1.0)*x);} 

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439); 
  vec2 i  = floor(v + dot(v, C.yy)); 
  vec2 x0 = v - i + dot(i, C.xx); 
  vec2 i1; 
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); 
  vec4 x12 = x0.xyxy + C.xxzz; 
  x12.xy -= i1; 
  i = mod289(i); 
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)); 
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); 
  m = m*m; 
  m = m*m; 
  vec3 x = 2.0 * fract(p * C.www) - 1.0; 
  vec3 h = abs(x) - 0.5; 
  vec3 ox = floor(x + 0.5); 
  vec3 a0 = x - ox; 
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h); 
  vec3 g; 
  g.x  = a0.x  * x0.x  + h.x  * x0.y; 
  g.yz = a0.yz * x12.xz + h.yz * x12.yw; 
  return 130.0 * dot(m, g);
}
//END NOISE


vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
  return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
}


// Fonction slerp corrigée pour GLSL
vec4 slerp(vec4 v0, vec4 v1, float t) {
  // Normaliser les vecteurs sans modifier les originaux
  vec4 v0n = normalize(v0);
  vec4 v1n = normalize(v1);

  // Calculer le cosinus de l'angle entre les deux vecteurs
  float dot_ = dot(v0n, v1n);

  // S'assurer que nous prenons le chemin le plus court
  if (dot_ < 0.0) {
    v1n = -v1n;
    dot_ = -dot_;
  }  

  const float DOT_THRESHOLD = 0.9995;
  if (dot_ > DOT_THRESHOLD) {
    // Si les vecteurs sont presque parallèles, interpoler linéairement
    vec4 result = normalize(v0n + t * (v1n - v0n));
    return result;
  }

  // Interpolation sphérique
  float theta_0 = acos(dot_);
  float theta = theta_0 * t;
  float sin_theta = sin(theta);
  float sin_theta_0 = sin(theta_0);

  float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
  float s1 = sin_theta / sin_theta_0;

  return (s0 * v0n) + (s1 * v1n);
}

void main() {
  // Position relative du vertex le long de l'axe Y du mesh
  frc = position.y / float(${height});

  // Obtenir des données de vent à partir du bruit simplex avec des paramètres ajustés
  // Utiliser windFrequency pour contrôler la fréquence spatiale et temporelle
  
// Rendre la dépendance temporelle plus forte et directe
float windPhase = time * windFrequency * 3.0 + windOffset;
  float noiseScale = 0.05; // Échelle spatiale pour éviter les artefacts
  
  // Utiliser des coordonnées différentes pour chaque brin d'herbe
  vec2 noiseCoord = vec2(
  (offset.x * noiseScale + windPhase),  // Plus forte dépendance au temps
  (offset.z * noiseScale + windPhase * 0.8)
);
  
  // Utiliser un second bruit pour plus de réalisme
  vec2 noiseCoord2 = vec2(
  (offset.x * noiseScale * 2.0 + windPhase * 1.2),
  (offset.z * noiseScale * 2.0 + windPhase * 1.5)
);
  
  // Adoucir le bruit pour éviter les artefacts
  float noise = snoise(noiseCoord) * 0.5 + 0.5; // Ramener à [0,1]
  float noise2 = snoise(noiseCoord2) * 0.5 + 0.5; // Second bruit
  
  // Combiner les deux bruits
  noise = mix(noise, noise2, 0.3);
  
  // Appliquer une courbe plus prononcée pour accentuer les différences
  noise = noise * noise * noise; // Courbe cubique pour plus de contraste
  
  // Utiliser windStrength pour contrôler l'amplitude
  // Multiplier par frc pour que l'effet soit plus fort au sommet
  noise = noise * windStrength * mix(0.3, 1.0, frc);

  // Définir la direction d'un brin d'herbe non courbé, tourné autour de l'axe Y
  vec4 direction = vec4(0.0, halfRootAngleSin, 0.0, halfRootAngleCos);

  // Interpoler entre la direction non courbée et la direction de croissance calculée sur le CPU
  // En utilisant la position relative du vertex le long de l'axe Y comme poids
  direction = slerp(direction, orientation, frc);
  
  // Appliquer l'étirement
  vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
  vPosition = rotateVectorByQuaternion(vPosition, direction);

  // Appliquer le vent
  // Calculer une direction de vent variable avec une forte dépendance temporelle

  float windAngleX = sin(time * 2.0) * 0.2; // Variation plus rapide et plus ample
float windAngleZ = cos(time * 1.5) * 0.2; // Variation plus rapide et plus ample
  
  // Calcul d'un angle de vent visible

  float halfAngle = noise * 0.3; // Augmenter l'angle pour plus d'effet
  
  // Créer un quaternion qui décrit la rotation due au vent
  
  vec4 windQuaternion = vec4(
    sin(halfAngle) * cos(windAngleX), 
    0.0, 
    sin(halfAngle) * sin(windAngleZ), 
    cos(halfAngle)
  );
  
  windQuaternion = normalize(windQuaternion);
  
  // Appliquer la rotation du vent uniquement si nous ne sommes pas à la racine
  // Pondérer par frc pour que l'effet soit plus fort au sommet
  if (frc > 0.2) {
    vPosition = rotateVectorByQuaternion(vPosition, windQuaternion);
  }

  // UV pour la texture
  vUv = uv;

  // Calculer la position finale du vertex à partir du décalage mondial et des transformations ci-dessus
  gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
}`;

export const fragmentSource = `
precision mediump float;
uniform sampler2D map;
uniform sampler2D alphaMap;
varying vec2 vUv;
varying float frc;

void main() {
  // Obtenir les informations de transparence à partir de la carte alpha
  float alpha = texture2D(alphaMap, vUv).r;
  // Si transparent, ne pas dessiner
  if(alpha < 0.15) {
    discard;
  }
  // Obtenir les données de couleur à partir de la texture
  vec4 col = texture2D(map, vUv);
  // Ajouter plus de vert vers la racine
  col = mix(vec4(0.0, 0.3, 0.0, 1.0), col, frc);
  // Ajouter une ombre vers la racine pour plus de profondeur
  col = mix(vec4(0.0, 0.1, 0.0, 1.0), col, frc * 0.5 + 0.5);
  gl_FragColor = col;
}`;
