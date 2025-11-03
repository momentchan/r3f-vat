import * as THREE from 'three'
import { useEffect, useRef, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps } from './types'
import { extractGeometryFromScene, createVATInstancedMesh, calculateVATFrame } from './utils'

export interface VATInstancedMeshProps extends Omit<VATMeshProps, 'id'> {
  count: number
  positions?: Float32Array
  rotations?: Float32Array
  scales?: Float32Array
}

export const VATInstancedMesh = forwardRef<THREE.Group, VATInstancedMeshProps>(function VATInstancedMesh({
  scene,
  posTex,
  nrmTex = null,
  metaData,
  vatSpeed = 1,
  paused = false,
  useDepthMaterial = true,
  frameRatio,
  count,
  positions,
  rotations,
  scales,
  ...rest
}: VATInstancedMeshProps, ref) {
  const materialControls = useControls('VAT.Instanced.Material', {
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

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const depthInstancedMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const dummyRef = useRef<THREE.Object3D>(new THREE.Object3D())
  const { scene: r3fScene } = useThree()

  // Create instanced mesh
  useEffect(() => {
    // Remove old instances if exist
    if (instancedMeshRef.current && groupRef.current) {
      groupRef.current.remove(instancedMeshRef.current)
      instancedMeshRef.current.dispose()
    }
    if (depthInstancedMeshRef.current && groupRef.current) {
      groupRef.current.remove(depthInstancedMeshRef.current)
      depthInstancedMeshRef.current.dispose()
    }

    // Extract geometry from scene
    const geometry = extractGeometryFromScene(scene)
    if (!geometry) {
      console.error('VATInstancedMesh: Could not extract geometry from scene')
      return
    }

    // Create instanced mesh
    const { instancedMesh, materials, depthInstancedMesh } = createVATInstancedMesh(
      geometry, posTex, nrmTex, r3fScene.environment, metaData, materialControls, count, useDepthMaterial
    )

    materialsRef.current = materials
    instancedMeshRef.current = instancedMesh
    
    // Set instance matrices
    for (let i = 0; i < count; i++) {
      const x = positions ? positions[i * 3] : 0
      const y = positions ? positions[i * 3 + 1] : 0
      const z = positions ? positions[i * 3 + 2] : 0
      
      dummyRef.current.position.set(x, y, z)
      
      if (rotations) {
        dummyRef.current.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2])
      }
      
      if (scales) {
        dummyRef.current.scale.set(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2])
      }
      
      dummyRef.current.updateMatrix()
      instancedMesh.setMatrixAt(i, dummyRef.current.matrix)
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true
    
    if (depthInstancedMesh) {
      depthInstancedMeshRef.current = depthInstancedMesh
      depthInstancedMesh.instanceMatrix = instancedMesh.instanceMatrix
      groupRef.current.add(depthInstancedMesh)
    }

    if (groupRef.current) {
      groupRef.current.add(instancedMesh)
    }

    return () => {
      if (instancedMeshRef.current && groupRef.current) {
        groupRef.current.remove(instancedMeshRef.current)
        instancedMeshRef.current.dispose()
      }
      if (depthInstancedMeshRef.current && groupRef.current) {
        groupRef.current.remove(depthInstancedMeshRef.current)
        depthInstancedMeshRef.current.dispose()
      }
    }
  }, [scene, posTex, nrmTex, metaData, useDepthMaterial, count, positions, rotations, scales, materialControls])

  // Update materials when controls change
  useEffect(() => {
    for (const material of materialsRef.current) {
      if (material.uniforms) {
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

