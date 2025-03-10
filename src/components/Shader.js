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

  // Définir la direction d'un brin d'herbe non courbé, tourné autour de l'axe Y avec une légère inclinaison
  vec4 direction = vec4(0.1, halfRootAngleSin, 0.0, halfRootAngleCos); // Inclinaison légère sur l'axe X

  // Interpoler entre la direction non courbée et la direction de croissance calculée sur le CPU
  // En utilisant la position relative du vertex le long de l'axe Y comme poids
  direction = slerp(direction, orientation, frc);
  
  // Appliquer l'étirement sans vent
  vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
  vPosition = rotateVectorByQuaternion(vPosition, direction);

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
