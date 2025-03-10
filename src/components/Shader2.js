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
  attribute float windOffset;
  uniform float time;
  uniform float windStrength;
  uniform float windFrequency;
  varying vec2 vUv;
  varying float frc;
  
  // === FONCTION DE BRUIT SIMPLEX ===
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
    // Fonction de rotation robuste
    vec3 qvec = q.xyz;
    float qw = q.w;
    
    return v + 2.0 * cross(cross(v, qvec) + qw * v, qvec);
  }
  
  vec4 slerp(vec4 a, vec4 b, float t) {
    // Interpolation sphérique entre quaternions
    float cosHalfTheta = dot(a, b);
    
    // Gérer le cas où les quaternions sont similaires ou opposés
    if (abs(cosHalfTheta) >= 0.999) {
      return normalize(mix(a, b, t));
    }
    
    // Interpolation sphérique standard
    float halfTheta = acos(cosHalfTheta);
    float sinHalfTheta = sqrt(1.0 - cosHalfTheta * cosHalfTheta);
    
    float ratioA = sin((1.0 - t) * halfTheta) / sinHalfTheta;
    float ratioB = sin(t * halfTheta) / sinHalfTheta;
    
    return normalize(a * ratioA + b * ratioB);
  }
  
  void main() {
    // Position relative du vertex
    frc = position.y / float(${height});
    
    // === PARAMÈTRES DE L'ANIMATION ===

    float baseSwayFrequency = 0.5 + windFrequency * 0.5; // Fréquence de base du balancement
    float swayAmplitude = max(0.0, windStrength * 0.1); // Amplitude du balancement
    
    // Position et facteurs naturels
    float uniqueOffset = windOffset * 20.0; // Décalage unique pour chaque brin
    vec2 worldPos = vec2(offset.x, offset.z) * 0.1; // Position dans le monde
    
    // === UTILISATION DU BRUIT SIMPLEX POUR LE VENT ===
    
    float noise = 1.0 - (snoise(vec2((time - offset.x / 25.0), (time - offset.z / 50.0))));
    
    // Direction de base de l'herbe (orientation du brin)
    vec4 direction = vec4(0.0, halfRootAngleSin, 0.0, halfRootAngleCos);
    
    // Interpolation entre la direction non pliée et la direction de croissance calculée sur le CPU
    direction = slerp(direction, orientation, frc);
    vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
    vPosition = rotateVectorByQuaternion(vPosition, direction);
    
    // Appliquer le vent
    float halfAngle = -noise * 0.15; // Inverser le sens du vent
    vPosition = rotateVectorByQuaternion(vPosition, normalize(vec4(sin(halfAngle), 0.0, -sin(halfAngle), cos(halfAngle))));
    
    // === APPLICATION DE L'ANIMATION ===
    // Résistance physique: les herbes sont plus rigides à la base
    // Fonction d'augmentation non-linéaire pour imiter la résistance naturelle des plantes
    float flexibilityFactor = pow(frc, 1.8); // Un peu moins rigide à la base (1.8 au lieu de 2.0)
    
    if (frc > 0.05) { // Pratiquement immobile à la toute base
      // Calculer le déplacement en X et Z selon la direction du vent
      float xDisplacement = vPosition.x * swayAmplitude * 1.1; // Plus fort
      float zDisplacement = vPosition.z * swayAmplitude * 1.1; // Plus fort
      
      // Appliquer le déplacement avec flexibilité progressive
      vPosition.x += xDisplacement * flexibilityFactor;
      vPosition.z += zDisplacement * flexibilityFactor;
      
      // Petite modification en Y pour l'effet de courbure naturelle
      // Les herbes s'allongent légèrement quand elles se penchent
      float stretchFactor = 1.0 - pow(vPosition.y, 2.0) * 0.04; // Plus fort
      vPosition.y *= stretchFactor;
    }
    
    // UV pour la texture
    vUv = uv;
    
    // Position finale
    gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
  }`;
  
  export const fragmentSource = `
  precision mediump float;
  uniform sampler2D map;
  uniform sampler2D alphaMap;
  varying vec2 vUv;
  varying float frc;
  
  void main() {
    // Obtenir les informations de transparence
    float alpha = texture2D(alphaMap, vUv).r;
    if(alpha < 0.15) {
      discard;
    }
    // Couleur de base
    vec4 col = texture2D(map, vUv);
    // Gradient de couleur
    col = mix(vec4(0.0, 0.3, 0.0, 1.0), col, frc);
    // Ombrage
    col = mix(vec4(0.0, 0.1, 0.0, 1.0), col, frc * 0.5 + 0.5);
    gl_FragColor = col;
  }`;
  