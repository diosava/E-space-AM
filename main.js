// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initGSAP();
});

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // 2D Plane Camera
    
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Uniforms (Data passed to shader)
    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uColor1: { value: new THREE.Color(0x0b0c10) }, // Dark BG
        uColor2: { value: new THREE.Color(0x00444f) }, // Deep Teal
        uColor3: { value: new THREE.Color(0x45f3ff) }, // Electric Blue
        uColor4: { value: new THREE.Color(0x66ff00) }  // Green
    };

    // 3. Custom Shader Material (Grainy Energy Flow)
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            
            varying vec2 vUv;

            // Simple noise function
            float random (in vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // 2D Noise
            float noise (in vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            // Fractional Brownian Motion (for flowing clouds effect)
            float fbm (in vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 0.0;
                for (int i = 0; i < 3; i++) {
                    value += amplitude * noise(st);
                    st *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                vec2 st = gl_FragCoord.xy / uResolution.xy;
                st.x *= uResolution.x / uResolution.y;

                // Mouse interaction
                vec2 mouse = uMouse * uResolution / uResolution.y;
                float dist = distance(st, mouse);
                
                // Flowing coordinates
                vec2 q = vec2(0.);
                q.x = fbm(st + 0.1 * uTime);
                q.y = fbm(st + vec2(1.0));

                vec2 r = vec2(0.);
                r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
                r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

                float f = fbm(st + r);

                // Mix colors based on noise value
                vec3 color = mix(uColor1, uColor2, clamp((f*f)*4.0,0.0,1.0));
                color = mix(color, uColor3, clamp(length(q),0.0,1.0));
                color = mix(color, uColor4, clamp(length(r.x),0.0,1.0));

                // Add Dithering / Grain
                float grain = random(st * uTime) * 0.15; // Strength of grain
                color += grain;

                // Vignette
                float vignette = 1.0 - smoothstep(0.5, 1.5, length(vUv - 0.5));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    // 4. Create Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // 5. Animation Loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
    }
    animate();

    // 6. Event Listeners
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uResolution.value.x = window.innerWidth;
        uniforms.uResolution.value.y = window.innerHeight;
    });

    document.addEventListener('mousemove', (e) => {
        // Normalize mouse position for shader
        uniforms.uMouse.value.x = e.clientX / window.innerWidth;
        uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight);
    });
}

function initGSAP() {
    // Reveal Canvas
    gsap.to('#canvas-container', {
        duration: 2,
        opacity: 1,
        ease: 'power2.inOut'
    });

    // Animate Hero Text
    gsap.from('.reveal-text', {
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power3.out',
        delay: 0.5
    });

    // Animate Nav
    gsap.from('.nav', {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 1
    });
}