import { CameraControls, useTexture } from "@react-three/drei";
import { CanvasCapture } from "@packages/r3f-gist/components/utility";
import { useVATPreloader } from "./vat/VATPreloader";
import { VATMesh } from "./vat/VATMesh";
import EnvironmentSetup from "./EnvironmentSetup";
import Lights from "./Lights";
import { VATInstancedMesh } from "./vat/VATInstancedMesh";
import { useEffect, useMemo } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import Effects from "./Effects";
import blending from "@packages/r3f-gist/shaders/cginc/math/blending.glsl"

export default function Scene() {
    const { scene, posTex, nrmTex, meta, isLoaded } = useVATPreloader(
        '/vat/Rose.glb',
        '/vat/Rose_pos.exr',
        '/vat/Rose_nrm.png',
        '/vat/Rose_meta.json')

    const count = 1000
    const positions = useMemo(() => {
        const positions = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            positions[i * 3] = Math.random() * 2
            positions[i * 3 + 1] = 0
            positions[i * 3 + 2] = Math.random() * 2
        }
        return positions
    }, [count])
    const rotations = useMemo(() => {
        const rotations = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            rotations[i * 3] = 0
            rotations[i * 3 + 1] = 0
            rotations[i * 3 + 2] = 0
        }
        return rotations
    }, [count])
    const scales = useMemo(() => {
        const scales = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            scales[i * 3] = 1
            scales[i * 3 + 1] = 1
            scales[i * 3 + 2] = 1
        }
        return scales
    }, [count])

    const petalTex = useTexture('/textures/Rose Petal DIff.png')
    petalTex.colorSpace = THREE.SRGBColorSpace

    const outlineTex = useTexture('/textures/Rose Outline.png')

    const normalMapTex = useTexture('/textures/Rose Petal Normal.png')

    // Leva controls for VAT custom uniforms
    const vatUniforms = useControls('VAT.Uniforms', {
        uLeafColor: { value: '#203e20', label: 'Leaf Color' },
        uStemColor: { value: '#233820', label: 'Stem Color' },
    }, { collapsed: true })

    const materialConfig = useMemo(() => ({
        roughness: 1,
        metalness: 0.05,
        clearcoat: 0,
        sheen: 0,
    }), [])
    
    const customUniforms = useMemo(() => ({
        uColor: { value: new THREE.Vector3(1.0, 0.0, 0.0) },
        uLeafColor: { value: new THREE.Color(vatUniforms.uLeafColor) },
        uStemColor: { value: new THREE.Color(vatUniforms.uStemColor) },
        uPetalTex: { value: petalTex },
        uOutlineTex: { value: outlineTex }
    }), [petalTex, vatUniforms.uLeafColor, vatUniforms.uStemColor, outlineTex])


    // Memoize shader code separately - this should never change
    const shaders = useMemo(() => ({
        fragmentShader: /* glsl */ `
            ${blending}

            uniform vec3 uColor;
            uniform vec3 uLeafColor;
            uniform vec3 uStemColor;
            varying vec2 vUv;
            varying vec2 vUv2;
            varying vec3 vColor;
            uniform sampler2D uPetalTex;
            uniform sampler2D uOutlineTex;

            void main() {
                vec2 uv = vUv;
                uv.x = (uv.x - 0.5) * 0.8 + 0.5;
                vec4 petalCol = texture2D(uPetalTex, uv);
                vec4 outline = texture2D(uOutlineTex, vUv);

                float epsilon = 0.05;
                float petalMask = step(abs(vColor.r - 0.7), epsilon);
                float leafMask = step(abs(vColor.r - 0.0), epsilon);
                float stemMask = step(abs(vColor.r - 1.0), epsilon);
                
                petalCol.rgb = mix(HSVShift(petalCol.rgb, vec3(0.0, 0.0, -.1)), petalCol.rgb, outline.rgb);


                vec3 finalColor = petalCol.rgb * petalMask + uLeafColor * leafMask + uStemColor * stemMask;

                csm_DiffuseColor = vec4(finalColor, petalCol.a);
            }
        `
    }), [])


    return (
        <>
            <color attach="background" args={['#000000']} />
            <Lights />
            <EnvironmentSetup />
            {/* <fogExp2 attach="fog" args={['#000000', 0.05]} /> */}
            <Effects />

            <mesh rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="white" />
            </mesh> */}

            <CameraControls makeDefault />

            <CanvasCapture />




            {isLoaded && scene && (
                <>
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



                    // Use the instanced mesh
                    <VATInstancedMesh
                        scene={scene}
                        posTex={posTex}
                        nrmTex={nrmTex}
                        metaData={meta}
                        count={count}
                        frameRatio={0.5}
                        positions={positions}
                        rotations={rotations}
                        scales={scales}
                        useDepthMaterial={true}
                        materialConfig={materialConfig}
                        shaders={shaders}
                        customUniforms={customUniforms}
                    />
                </>
            )}
        </>
    )
}

