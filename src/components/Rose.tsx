import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { VATMesh } from "./vat/VATMesh";
import { VATInstancedMesh } from "./vat/VATInstancedMesh";
import { useVATPreloader } from "./vat/VATPreloader";
import { useFrameCompute } from "./vat/hooks";
import { useControls } from "leva";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import blending from "@packages/r3f-gist/shaders/cginc/math/blending.glsl"
import simplexNoise from "@packages/r3f-gist/shaders/cginc/noise/simplexNoise.glsl"
import utility from "@packages/r3f-gist/shaders/cginc/math/utility.glsl"
import vat from "./vat/shaders/vat.glsl"
import { generateHalton2D } from "@packages/r3f-gist/utils";

export default function Rose() {
    const { scene, posTex, nrmTex, meta, isLoaded } = useVATPreloader('/vat/Rose_meta.json')

    const petalTex = useTexture('/textures/Rose/Rose_Petal_Diff.png')
    petalTex.colorSpace = THREE.SRGBColorSpace

    const outlineTex = useTexture('/textures/Rose/Rose_Outline.png')

    const normalMapTex = useTexture('/textures/Rose/Rose_Petal_Normal.png')
    normalMapTex.repeat.set(0.8, 1)
    normalMapTex.offset.set(0.1, 0)

    // Leva controls organized under VAT folder with subfolders
    const vatUniforms = useControls('VAT.Uniforms', {
        uGreen1: { value: '#325825', label: 'Green 1' },
        uGreen2: { value: '#4f802b', label: 'Green 2' },
    }, { collapsed: true })

    const noiseControls = useControls('VAT.Noise Effects', {
        displacementStrength: { value: 0.1, min: 0, max: 1, step: 0.01, label: 'Displacement Strength' },
        normalStrength: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Normal Strength' },
        noiseScale: { value: { x: 5, y: 20 }, label: 'Noise Scale' },
    }, { collapsed: true })

    const renderControls = useControls('VAT.Render', {
        useInstanced: { value: true, label: 'Use Instanced Mesh' },
        instanceCount: { value: 1000, min: 1, max: 2000, step: 50, label: 'Instance Count' },
    }, { collapsed: true })

    const stateDurationsControls = useControls('VAT.Frame States', {
        state0Min: { value: 0, min: 0, max: 10, step: 0.1, label: 'State 0: Stay at 0 - Min (s)' },
        state0Max: { value: 0, min: 0, max: 10, step: 0.1, label: 'State 0: Stay at 0 - Max (s)' },
        state1Min: { value: 3, min: 0, max: 10, step: 0.1, label: 'State 1: 0→1 - Min (s)' },
        state1Max: { value: 5, min: 0, max: 10, step: 0.1, label: 'State 1: 0→1 - Max (s)' },
        state2Min: { value: 3, min: 0, max: 10, step: 0.1, label: 'State 2: Stay at 1 - Min (s)' },
        state2Max: { value: 3, min: 0, max: 10, step: 0.1, label: 'State 2: Stay at 1 - Max (s)' },
        state3Min: { value: 4, min: 0, max: 10, step: 0.1, label: 'State 3: 1→0 - Min (s)' },
        state3Max: { value: 5, min: 0, max: 10, step: 0.1, label: 'State 3: 1→0 - Max (s)' },
    }, { collapsed: true })

    // Instance data for instanced mesh (ready for future use)
    const planeUV = useMemo(() => generateHalton2D(renderControls.instanceCount), [renderControls.instanceCount])


    const planeUVTexture = useMemo(() => {
        const texture = new THREE.DataTexture(
            planeUV,
            renderControls.instanceCount,
            1,
            THREE.RGFormat,
            THREE.FloatType
        )
        texture.needsUpdate = true
        texture.minFilter = THREE.NearestFilter
        texture.magFilter = THREE.NearestFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        return texture
    }, [planeUV, renderControls.instanceCount])

    useEffect(() => {
        return () => {
            planeUVTexture.dispose()
        }
    }, [planeUVTexture])


    const positions = useMemo(() => {
        const positions = new Float32Array(renderControls.instanceCount * 3)
        for (let i = 0; i < renderControls.instanceCount; i++) {
            positions[i * 3] = (planeUV[i * 2] - 0.5) * 2
            positions[i * 3 + 1] = 0
            positions[i * 3 + 2] = (planeUV[i * 2 + 1] - 0.5) * 2
        }
        return positions
    }, [planeUV])
    
    const rotations = useMemo(() => {
        const rotations = new Float32Array(renderControls.instanceCount * 3)
        for (let i = 0; i < renderControls.instanceCount; i++) {
            rotations[i * 3] = 0
            rotations[i * 3 + 1] = Math.random() * 2 * Math.PI
            rotations[i * 3 + 2] = 0
        }
        return rotations
    }, [renderControls.instanceCount])
    const scales = useMemo(() => {
        const scales = new Float32Array(renderControls.instanceCount * 3)
        for (let i = 0; i < renderControls.instanceCount; i++) {
            const size = (Math.random() * 0.8 + 1) * 4
            scales[i * 3] = size
            scales[i * 3 + 1] = size
            scales[i * 3 + 2] = size
        }
        return scales
    }, [renderControls.instanceCount])

    const materialConfig = useMemo(() => ({
        roughness: 1,
        metalness: 0.05,
        clearcoat: 0,
        sheen: 0,
        normalMap: normalMapTex,
        normalScale: new THREE.Vector2(4, 4),
    }), [normalMapTex])

    const customUniforms = useMemo(() => ({
        uColor: { value: new THREE.Vector3(1.0, 0.0, 0.0) },
        uGreen1: { value: new THREE.Color(vatUniforms.uGreen1) },
        uGreen2: { value: new THREE.Color(vatUniforms.uGreen2) },
        uPetalTex: { value: petalTex },
        uOutlineTex: { value: outlineTex },
        // Noise uniforms
        uDisplacementStrength: { value: noiseControls.displacementStrength },
        uNormalStrength: { value: noiseControls.normalStrength },
        uNoiseScale: { value: new THREE.Vector2(noiseControls.noiseScale.x, noiseControls.noiseScale.y) },
        uPlaneUVTexture: { value: planeUVTexture },
        uTime: { value: 0 },
    }), [petalTex, vatUniforms.uGreen1, vatUniforms.uGreen2, outlineTex, noiseControls, planeUVTexture])

    useFrame((state) => {
        if (customUniforms?.uTime) {
            customUniforms.uTime.value = state.clock.elapsedTime;
        }
    })

    // Memoize shader code separately - this should never change
    const shaders = useMemo(() => ({
        vertexShader: /* glsl */ `
            uniform float uDisplacementStrength;
            uniform float uNormalStrength;
            uniform vec2 uNoiseScale;
            uniform sampler2D uFrameTexture; // Texture containing per-instance frame values
            uniform sampler2D uPlaneUVTexture; // Texture containing per-instance plane UVs
            uniform float uInstanceCount; // Total number of instances
            uniform float uTime;

            
            attribute float instanceSeed;
            attribute float instanceID; // Instance index (0 to instanceCount-1)

            varying vec2 vUv;
            varying vec3 vMask;
            varying float vInstanceSeed;
            varying vec3 vWpos;
            varying float vProgress;
            
            ${vat}
            ${simplexNoise}
            ${utility}
            
            void main() {
                // Get instance index from attribute
                float instanceIndex = instanceID;
                
                // Sample frame value from compute shader texture
                // Texture is 1D: width = instanceCount, height = 1
                vec2 instanceUV = vec2((instanceIndex + 0.5) / uInstanceCount, 0.5);


                vec2 planeUV = texture2D(uPlaneUVTexture, instanceUV).rg;
                vec4 frameData = texture2D(uFrameTexture, instanceUV);
                float frame = frameData.r;
                float progress = frameData.a;

                vProgress = progress;

                // Get the VAT position
                vec3 vatPos = VAT_pos(frame);
                vec3 basePos = position;
                vec3 position = (basePos + vatPos);
                
                // Get the VAT normal
                vec3 normal = VAT_nrm(frame);
                
                // Compute masks
                float epsilon = 0.05;
                vMask.x = step(abs(color.r - 0.7), epsilon); // petalMask
                vMask.y = step(abs(color.r - 0.0), epsilon); // leafMask
                vMask.z = step(abs(color.r - 1.0), epsilon); // stemMask


                #ifdef USE_INSTANCING
                    mat4 worldMatrix = modelMatrix * instanceMatrix;
                #else
                    mat4 worldMatrix = modelMatrix;
                #endif

                
                vWpos = (worldMatrix * vec4(position, 1.0)).xyz;

                vec3 noise = snoiseVec3(vec3(planeUV.xy * 0.2,  uTime * 0.1)) * 0.02 * vWpos.y;
                noise.y*= 0.2;

                csm_Position = position + noise;

                csm_Normal = normal;
                vUv = uv;
                vUv1 = uv1;
                vColor = color.rgb;
                vInstanceSeed = instanceSeed;
            }
        `,

        fragmentShader: /* glsl */ `
            ${blending}
            ${simplexNoise}
            ${utility}

            uniform vec3 uColor;
            uniform vec3 uGreen1;
            uniform vec3 uGreen2;
            uniform vec3 uStemColor;
            uniform float uNormalStrength;
            uniform vec2 uNoiseScale;
            
            varying vec2 vUv;
            varying vec2 vUv1;
            varying vec3 vColor;
            varying vec3 vMask;
            varying vec3 vWpos;
            varying float vInstanceSeed;
            varying float vProgress;
            uniform sampler2D uPetalTex;
            uniform sampler2D uOutlineTex;

            
            float fbm2(vec2 p, float t)
            {
                float f;
                f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
                f += 0.25000 * simplexNoise3d(vec3(p, t));
                return f * (1.0 / 0.75) * 0.5 + 0.5;
            }

            void main() {
                vec2 uv = vUv;
                uv.x = (uv.x - 0.5) * 0.8 + 0.5;
                vec4 outline = texture2D(uOutlineTex, vUv);

                float seed = vInstanceSeed;
                
                // Use masks computed in vertex shader
                float petalMask = vMask.x;
                float leafMask = vMask.y;
                float stemMask = vMask.z;
                
                vec4 petalCol =  texture2D(uPetalTex, uv);

                petalCol.rgb = HSVShift(petalCol.rgb, vec3(seed * (0.02 + smoothstep(0.6, 1.0, vProgress) * 0.03), 0.0, mod(seed * 25.0, 1.0) * -0.1));
                petalCol.rgb = mix(HSVShift(petalCol.rgb, vec3(0.0, 0.0, -.1)), petalCol.rgb, outline.rgb);

                // Use instance seed to offset noise for per-instance variation
                float n = remap(fbm2(vUv * uNoiseScale, vInstanceSeed * 100.0), vec2(-1.0, 1.0), vec2(0.0, 1.0));

                vec3 stemfCol = mix(uGreen1, uGreen2, n);
                vec3 finalColor = petalCol.rgb * petalMask + stemfCol * leafMask + stemfCol * stemMask;
                
                float dieOut = mix(0.2, 1.0, smoothstep(1.0, 0.6, vProgress));
                csm_DiffuseColor = vec4(finalColor * dieOut, petalCol.a);

                // csm_FragColor = vec4(vWpos.xz, 0.0, 1.0);
            }
        `
    }), [noiseControls])

    if (!isLoaded || !scene || !posTex || !nrmTex || !meta) {
        return null;
    }


    // Use FBO compute shader to calculate per-instance frame values
    const frameTexture = useFrameCompute({
        instanceCount: renderControls.instanceCount,
        metaData: meta,
        vatSpeed: 1,
        paused: false,
        stateDurations: {
            state0: { min: stateDurationsControls.state0Min, max: stateDurationsControls.state0Max },
            state1: { min: stateDurationsControls.state1Min, max: stateDurationsControls.state1Max },
            state2: { min: stateDurationsControls.state2Min, max: stateDurationsControls.state2Max },
            state3: { min: stateDurationsControls.state3Min, max: stateDurationsControls.state3Max },
        },
        planeUVsTexture: planeUVTexture,
    })

    return (<>
        {renderControls.useInstanced ? (
            <VATInstancedMesh
                scene={scene}
                posTex={posTex}
                nrmTex={nrmTex}
                metaData={meta}
                count={renderControls.instanceCount}
                frameRatio={-1}
                positions={positions}
                rotations={rotations}
                scales={scales}
                useDepthMaterial={true}
                materialConfig={materialConfig}
                shaders={shaders}
                customUniforms={customUniforms}
                frameTexture={frameTexture}
            />
        ) : (
            <VATMesh
                scene={scene}
                posTex={posTex}
                nrmTex={nrmTex}
                metaData={meta}
                frameRatio={0.5}
                scale={10}
                materialConfig={materialConfig}
                shaders={shaders}
                customUniforms={customUniforms}
            />
        )}
    </>);
}
