import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  uniform float globalEntropy;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    
    // Entropy-driven turbulence
    float speed = 0.05 + globalEntropy * 0.2;
    float scale = 4.0 + globalEntropy * 4.0;
    
    float n1 = noise(uv * scale + time * speed);
    float n2 = noise(uv * scale * 2.0 - time * speed * 1.5);
    float combined = (n1 + n2 * 0.5) / 1.5;
    
    // Spectral distortion
    if (globalEntropy > 0.5) {
      float distortion = sin(uv.y * 50.0 + time * 10.0) * 0.002 * globalEntropy;
      uv.x += distortion;
    }

    vec3 graphite = vec3(0.02, 0.02, 0.025);
    vec3 tungsten = vec3(0.04, 0.05, 0.06);
    vec3 cyan = vec3(0.29, 0.62, 1.0) * (0.02 + globalEntropy * 0.05);
    
    float intensity = pow(combined, 4.0 - globalEntropy * 2.0);
    vec3 finalColor = mix(graphite, tungsten, combined);
    finalColor += cyan * intensity;
    
    // Grain increases with entropy
    finalColor += (hash(uv + time) - 0.5) * (0.005 + globalEntropy * 0.01);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function Field({ entropy }: { entropy: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },
    globalEntropy: { value: entropy }
  }), []);

  useFrame((state) => {
    uniforms.time.value = state.clock.getElapsedTime();
    uniforms.resolution.value.set(state.size.width, state.size.height);
    uniforms.globalEntropy.value = THREE.MathUtils.lerp(uniforms.globalEntropy.value, entropy, 0.05);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function BackgroundField({ entropy = 0.2 }: { entropy?: number }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Field entropy={entropy} />
      </Canvas>
    </div>
  );
}
