import * as THREE from 'three'
import { useEffect, useRef, useState, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps } from './types'
import { updatePhysicalProperties, updateAdvancedProperties } from './materials'
import { cloneAndSetupVATScene, calculateVATFrame } from './utils/materialSetup'

export const VATMesh = forwardRef<THREE.Group, VATMeshProps>(function VATMesh({
  gltf,
  posTex,
  nrmTex = null,
  metaData,
  vatSpeed = 1,
  paused = false,
  useDepthMaterial = true,
  frameRatio,
  id,
  ...rest
}: VATMeshProps, ref) {
  const materialPropertiesControls = useControls('VAT.Material', {
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

  const shaderControls = useControls('VAT.Shader', {
    noiseScale: { value: 1, min: 0, max: 10, step: 0.1 },
    noiseStrength: { value: 0.3, min: 0, max: 1, step: 0.01 },
    waveSpeed: { value: 0.3, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true })

  const materialControls = { ...materialPropertiesControls, ...shaderControls }

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const clonedSceneRef = useRef<THREE.Group | null>(null)
  const { scene } = useThree()
  const seed = useRef(THREE.MathUtils.randFloat(0, 1000))

  // Create materials and clone scene
  useEffect(() => {
    // Remove old scene if exists
    if (clonedSceneRef.current && groupRef.current) {
      groupRef.current.remove(clonedSceneRef.current)
    }

    const { scene: clonedScene, materials } = cloneAndSetupVATScene(
      gltf, posTex, nrmTex, scene.environment, metaData, materialControls, useDepthMaterial
    )

    materialsRef.current = materials
    clonedSceneRef.current = clonedScene

    if (groupRef.current) {
      groupRef.current.add(clonedScene)
    }

    return () => {
      if (clonedSceneRef.current && groupRef.current) {
        groupRef.current.remove(clonedSceneRef.current)
      }
    }
  }, [gltf, posTex, nrmTex, metaData, useDepthMaterial])

  useEffect(() => {
    for (const material of materialsRef.current) {
      updatePhysicalProperties(material, materialPropertiesControls)
      updateAdvancedProperties(material, materialPropertiesControls)
    }
  }, [materialPropertiesControls])

  useFrame((state, delta) => {
    if (paused) return

    const frame = calculateVATFrame(frameRatio, state.clock.elapsedTime, metaData, vatSpeed)

    for (const material of materialsRef.current) {
      material.uniforms.uFrame.value = frame
      material.uniforms.uSeed.value = seed.current
    }
  })

  return (
    <group ref={ref || groupRef} {...rest} scale={10} />
  )
})
