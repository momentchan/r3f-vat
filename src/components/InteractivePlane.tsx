import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntersectionUV } from './IntersectionContext';
import CustomShaderMaterial from 'three-custom-shader-material'
import { useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import blending from '@packages/r3f-gist/shaders/cginc/math/blending.glsl'

const INTERSECTION_FRAGMENT_SHADER = /* glsl */`
${blending}
uniform vec2 uIntersection;
uniform float uHasIntersection;
uniform float uRadius;
uniform float uFeather;
uniform vec3 uHighlightColor;
uniform vec3 uOverlayColor;

varying vec2 vUv;

void main() {
    vec4 baseColor = csm_DiffuseColor;

    if (uHasIntersection > 0.5) {
        float distanceToHit = distance(vUv, uIntersection);
        float highlight = smoothstep(uRadius + uFeather, uRadius, distanceToHit);
        baseColor.rgb = mix(baseColor.rgb, uHighlightColor, highlight);
    }

    baseColor.rgb = BlendOverlay(baseColor.rgb, uOverlayColor);
    csm_DiffuseColor = baseColor;
}
`;

const INTERSECTION_VERTEX_SHADER = /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv;
    csm_Position = position;
    csm_Normal = normal;
}
`;

export default function InteractivePlane() {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    const { raycaster, pointer, camera } = useThree();
    const intersectionUVRef = useIntersectionUV();
    const asphaltTextures = useTexture({
        // map: '/textures/Aerial/aerial_grass_rock_diff_1k.png',
        // aoMap: '/textures/Aerial/aerial_grass_rock_ao_1k.png',
        // displacementMap: '/textures/Aerial/aerial_grass_rock_disp_1k.png',
        // normalMap: '/textures/Aerial/aerial_grass_rock_nor_gl_1k.png',
        // roughnessMap: '/textures/Aerial/aerial_grass_rock_rough_1k.png',
        map: '/textures/Asphalt/asphalt_06_diff_1k.png',
        aoMap: '/textures/Asphalt/asphalt_06_ao_1k.png',
        displacementMap: '/textures/Asphalt/asphalt_06_disp_1k.png',
        normalMap: '/textures/Asphalt/asphalt_06_nor_gl_1k.png',
        roughnessMap: '/textures/Asphalt/asphalt_06_rough_1k.png',
    }) as {
        map: THREE.Texture;
        aoMap: THREE.Texture;
        displacementMap: THREE.Texture;
        normalMap: THREE.Texture;
        roughnessMap: THREE.Texture;
    };
    const {
        radius,
        feather,
        highlightColor,
        displacementScale,
        roughness,
        aoIntensity,
        normalScale,
        overlayColor,
    } = useControls('Interactive Plane', {
        radius: { value: 0.05, min: 0.0, max: 0.3, step: 0.005 },
        feather: { value: 0.025, min: 0.0, max: 0.3, step: 0.005 },
        highlightColor: { value: '#ff3366' },
        displacementScale: { value: 0.1, min: 0.0, max: 0.2, step: 0.005 },
        roughness: { value: 1, min: 0, max: 1, step: 0.01 },
        aoIntensity: { value: 1, min: 0, max: 5, step: 0.1 },
        normalScale: { value: 1, min: -2, max: 2, step: 0.05 },
        overlayColor: { value: '#cbc9c9' },
    });

    useEffect(() => {
        asphaltTextures.map.colorSpace = THREE.SRGBColorSpace;
        asphaltTextures.map.anisotropy = 8;
        asphaltTextures.roughnessMap.anisotropy = 4;
        asphaltTextures.aoMap.anisotropy = 4;
        asphaltTextures.normalMap.anisotropy = 4;
    }, [asphaltTextures]);
    const uniforms = useMemo(() => ({
        uIntersection: { value: new THREE.Vector2() },
        uHasIntersection: { value: 0 },
        uRadius: { value: 0.05 },
        uFeather: { value: 0.025 },
        uHighlightColor: { value: new THREE.Color('#ff3366') },
        uOverlayColor: { value: new THREE.Color('#000000') },
    }), []);
    useEffect(() => {
        uniforms.uRadius.value = radius;
        uniforms.uFeather.value = feather;
        uniforms.uHighlightColor.value.set(highlightColor);
        uniforms.uOverlayColor.value.set(overlayColor);
    }, [radius, feather, highlightColor, uniforms, overlayColor]);

    const normalScaleVector = useMemo(
        () => new THREE.Vector2(normalScale, normalScale),
        [normalScale]
    );

    const handlePointerMove = () => {
        if (!meshRef.current) return;

        // Update raycaster with current pointer position
        raycaster.setFromCamera(pointer, camera);
        
        // Perform raycast
        const intersects = raycaster.intersectObject(meshRef.current);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];

            // Store intersection UV
            if (intersection.uv) {
                if (!intersectionUVRef.current) {
                    intersectionUVRef.current = new THREE.Vector2();
                }
                intersectionUVRef.current.copy(intersection.uv);
                uniforms.uIntersection.value.copy(intersection.uv);
                uniforms.uHasIntersection.value = 1;
            }
        } else {
            // No intersection, clear the UV
            intersectionUVRef.current = null;
            uniforms.uHasIntersection.value = 0;
        }
    };

    return (
        <mesh 
            ref={meshRef}
            rotation-x={-Math.PI / 2} 
            receiveShadow
            onPointerMove={handlePointerMove}
        >
            <planeGeometry
                args={[2, 2, 128, 128]}
                onUpdate={(geometry) => {
                    if (geometry.attributes.uv) {
                        geometry.setAttribute(
                            'uv2',
                            new THREE.BufferAttribute(geometry.attributes.uv.array, 2)
                        );
                    }
                }}
            />
            <CustomShaderMaterial
                ref={materialRef}
                baseMaterial={THREE.MeshStandardMaterial}
                vertexShader={INTERSECTION_VERTEX_SHADER}
                fragmentShader={INTERSECTION_FRAGMENT_SHADER}
                uniforms={uniforms}
                map={asphaltTextures.map}
                aoMap={asphaltTextures.aoMap}
                roughnessMap={asphaltTextures.roughnessMap}
                normalMap={asphaltTextures.normalMap}
                displacementMap={asphaltTextures.displacementMap}
                displacementScale={displacementScale}
                aoMapIntensity={aoIntensity}
                roughness={roughness}
                normalScale={normalScaleVector}
                color="white"
            />
        </mesh>
    )
}