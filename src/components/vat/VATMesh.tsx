import * as THREE from 'three'
import { useEffect, useRef, forwardRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps, DEFAULT_VAT_MATERIAL } from './types'
import { cloneAndSetupVATScene, calculateVATFrame } from './utils'

export const VATMesh = forwardRef<THREE.Group, VATMeshProps>(function VATMesh({
  scene,
  posTex,
  nrmTex = null,
  metaData,
  vatSpeed = 1,
  paused = false,
  useDepthMaterial = true,
  frameRatio,
  id,
  shaders,
  customUniforms,
  meshConfig,
  materialConfig,
  ...rest
}: VATMeshProps, ref) {
  const levaControls = useControls('VAT.Material', {
    roughness: { value: 0.4, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.6, min: 0, max: 1, step: 0.01 },
    transmission: { value: 0, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0, min: 0, max: 10, step: 0.1 },
    ior: { value: 1.5, min: 1, max: 2.5, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1, min: 0, max: 2, step: 0.1 },
    bumpScale: { value: 1.0, min: 0, max: 1, step: 0.01 },
    sheen: { value: 0, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    sheenColor: '#3695ff',
    iridescence: { value: 0, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: 1.3, min: 1, max: 2.333, step: 0.01 },
    iridescenceThicknessMin: { value: 100, min: 0, max: 1000, step: 10 },
    iridescenceThicknessMax: { value: 400, min: 0, max: 1000, step: 10 },
    attenuationDistance: { value: Infinity, min: 0.01, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
  }, { collapsed: true })

  // Merge default values, Leva controls, and materialConfig
  const materialControls = useMemo(() => 
    ({ ...DEFAULT_VAT_MATERIAL, ...levaControls, ...materialConfig }), 
    [levaControls, materialConfig]
  )

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const vatSceneRef = useRef<THREE.Group | null>(null)
  const { scene: r3fScene } = useThree()

  // Memoize shader code strings to detect when shader code changes (not uniforms)
  // Extract shader code strings to stable references
  const vertexShaderCode = shaders?.vertexShader
  const fragmentShaderCode = shaders?.fragmentShader
  const depthVertexShaderCode = shaders?.depthVertexShader
  
  // Create a stable key that only changes when shader CODE changes (not uniforms)
  const shaderCodeKey = useMemo(() => {
    const key = `${vertexShaderCode || ''}|${fragmentShaderCode || ''}|${depthVertexShaderCode || ''}`
    return key
  }, [vertexShaderCode, fragmentShaderCode, depthVertexShaderCode])

  // Stabilize meshConfig to prevent unnecessary recreations
  const meshConfigRef = useRef(meshConfig)
  useEffect(() => {
    meshConfigRef.current = meshConfig
  }, [meshConfig])

  // Create materials and clone scene
  // Only recreate when shader CODE changes, not when uniforms change
  useEffect(() => {
    // Remove old scene if exists
    if (vatSceneRef.current && groupRef.current) {
      groupRef.current.remove(vatSceneRef.current)
    }

    const { vatScene, materials } = cloneAndSetupVATScene(
      scene, posTex, nrmTex, r3fScene.environment, metaData, materialControls, useDepthMaterial, shaders, customUniforms, meshConfigRef.current
    )

    materialsRef.current = materials
    vatSceneRef.current = vatScene

    if (groupRef.current) {
      groupRef.current.add(vatScene)
    }
    console.log('VATMesh re-created')

    return () => {
      if (vatSceneRef.current && groupRef.current) {
        groupRef.current.remove(vatSceneRef.current)
      }
    }
  }, [scene, posTex, nrmTex, metaData, useDepthMaterial, shaderCodeKey])

  // Update custom uniforms when they change (without recreating scene)
  useEffect(() => {
    if (!customUniforms) return

    for (const material of materialsRef.current) {
      if (material.uniforms) {
        // Update custom uniforms
        for (const [key, uniform] of Object.entries(customUniforms)) {
          if (material.uniforms[key] && uniform && typeof uniform === 'object' && 'value' in uniform) {
            const existingUniform = material.uniforms[key]
            const newValue = uniform.value

            // Handle THREE.Color
            if (newValue?.isColor && existingUniform.value?.isColor) {
              existingUniform.value.copy(newValue)
            }
            // Handle THREE.Vector3
            else if (newValue?.isVector3 && existingUniform.value?.isVector3) {
              existingUniform.value.copy(newValue)
            }
            // Handle THREE.Texture
            else if (newValue instanceof THREE.Texture) {
              existingUniform.value = newValue
            }
            // Handle primitive values (numbers, arrays, etc.)
            else {
              existingUniform.value = newValue
            }
          }
        }
        material.needsUpdate = true
      }
    }
  }, [customUniforms])

  // Update materials when controls change (without recreating scene)
  useEffect(() => {
    for (const material of materialsRef.current) {
      if (material.uniforms) {
        // Update material properties
        Object.assign(material, {
          roughness: materialControls.roughness,
          metalness: materialControls.metalness,
          transmission: materialControls.transmission,
          thickness: materialControls.thickness,
          ior: materialControls.ior,
          clearcoat: materialControls.clearcoat,
          clearcoatRoughness: materialControls.clearcoatRoughness,
          reflectivity: materialControls.reflectivity,
          envMapIntensity: materialControls.envMapIntensity,
          bumpScale: materialControls.bumpScale,
          sheen: materialControls.sheen,
          sheenRoughness: materialControls.sheenRoughness,
          sheenColor: new THREE.Color(materialControls.sheenColor),
          iridescence: materialControls.iridescence,
          iridescenceIOR: materialControls.iridescenceIOR,
          iridescenceThicknessRange: [materialControls.iridescenceThicknessMin, materialControls.iridescenceThicknessMax],
          attenuationDistance: materialControls.attenuationDistance,
          attenuationColor: new THREE.Color(materialControls.attenuationColor),
        })
        material.needsUpdate = true
      }
    }
  }, [materialControls])

  useFrame((state) => {
    if (paused) return

    const frame = calculateVATFrame(frameRatio, state.clock.elapsedTime, metaData, vatSpeed)

    for (const material of materialsRef.current) {
      material.uniforms.uFrame.value = frame
    }
  })

  return (
    <group ref={ref || groupRef} {...rest} />
  )
})
