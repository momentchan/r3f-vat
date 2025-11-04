import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { VATMeta, VATShaderOverrides, VATMeshConfig } from '../types'
import { createVATMaterial, createVATDepthMaterial } from '../materials'


/**
 * Ensure UV2 attribute exists for VAT geometry
 */
export function ensureUV2ForVAT(geometry: THREE.BufferGeometry, meta: VATMeta): void {
  if (geometry.getAttribute('uv2')) return

  const count = geometry.getAttribute('position').count
  const uv2Array = new Float32Array(count * 2)

  for (let i = 0; i < count; i++) {
    const colIndex = Math.floor(i / meta.texHeight)
    const vIndex = i % meta.texHeight
    const px = colIndex * meta.frameStride
    const py = vIndex
    const u = (px + 0.5) / meta.texWidth
    const v = (py + 0.5) / meta.texHeight

    uv2Array[2 * i + 0] = u
    uv2Array[2 * i + 1] = v
  }

  geometry.setAttribute('uv2', new THREE.BufferAttribute(uv2Array, 2))
}

// ========== VAT Material Setup Utils ==========

/**
 * Setup materials for a VAT mesh
 */
export function setupVATMaterials(
  mesh: THREE.Mesh,
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  metaData: VATMeta,
  materialControls: any,
  useDepthMaterial: boolean,
  shaderOverrides?: VATShaderOverrides,
  customUniforms?: Record<string, any>,
  meshConfig?: VATMeshConfig
): CustomShaderMaterial[] {
  const materials: CustomShaderMaterial[] = []

  ensureUV2ForVAT(mesh.geometry, metaData)

  const vatMaterial = createVATMaterial(posTex, nrmTex, envMap, metaData, materialControls, shaderOverrides, customUniforms)
  mesh.material = vatMaterial
  materials.push(vatMaterial)

  if (useDepthMaterial) {
    const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData, shaderOverrides, customUniforms)
    mesh.customDepthMaterial = vatDepthMaterial
    materials.push(vatDepthMaterial)
  }

  // Configure mesh properties
  const defaultConfig: VATMeshConfig = {
    frustumCulled: false,
    castShadow: true,
    receiveShadow: true
  }
  Object.assign(mesh, { ...defaultConfig, ...meshConfig })

  return materials
}

/**
 * Clone and setup VAT scene with materials
 */
export function cloneAndSetupVATScene(
  basisScene: THREE.Group,
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  metaData: VATMeta,
  materialControls: any,
  useDepthMaterial: boolean,
  shaderOverrides?: VATShaderOverrides,
  customUniforms?: Record<string, any>,
  meshConfig?: VATMeshConfig
): {
  vatScene: THREE.Group
  materials: CustomShaderMaterial[]
  mesh: THREE.Mesh | null
} {
  const vatScene = basisScene.clone()
  const materials: CustomShaderMaterial[] = []
  let vatMesh: THREE.Mesh | null = null

  vatScene.traverse((object: any) => {
    if (object.isMesh) {
      const mesh = object as THREE.Mesh
      const meshMaterials = setupVATMaterials(
        mesh, posTex, nrmTex, envMap, metaData, materialControls, useDepthMaterial, shaderOverrides, customUniforms, meshConfig
      )
      materials.push(...meshMaterials)
      vatMesh = mesh
    }
  })
  
  return { vatScene, materials, mesh: vatMesh }
}

/**
 * Calculate VAT frame based on animation mode
 */
export function calculateVATFrame(
  frameRatio: number | undefined,
  currentTime: number,
  metaData: VATMeta,
  speed: number
): number {
  if (frameRatio !== undefined) {
    return Math.min(frameRatio * metaData.frameCount, metaData.frameCount - 5)
  }
  return currentTime * (metaData.fps * speed) % metaData.frameCount
}

/**
 * Extract geometry from a THREE.Group/Scene
 */
export function extractGeometryFromScene(scene: THREE.Group): THREE.BufferGeometry | null {
  let geometry: THREE.BufferGeometry | null = null
  
  scene.traverse((object: any) => {
    if (object.isMesh && object.geometry && !geometry) {
      geometry = object.geometry.clone()
    }
  })
  
  return geometry
}

/**
 * Create VAT InstancedMesh
 */
export function createVATInstancedMesh(
  geometry: THREE.BufferGeometry,
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  metaData: VATMeta,
  materialControls: any,
  instanceCount: number,
  useDepthMaterial: boolean,
  shaderOverrides?: VATShaderOverrides,
  customUniforms?: Record<string, any>
): {
  instancedMesh: THREE.InstancedMesh
  materials: CustomShaderMaterial[]
  depthInstancedMesh?: THREE.InstancedMesh
} {
  ensureUV2ForVAT(geometry, metaData)

  const vatMaterial = createVATMaterial(posTex, nrmTex, envMap, metaData, materialControls, shaderOverrides, customUniforms)
  const instancedMesh = new THREE.InstancedMesh(geometry, vatMaterial, instanceCount)
  
  instancedMesh.frustumCulled = false
  instancedMesh.castShadow = true
  instancedMesh.receiveShadow = true

  const materials: CustomShaderMaterial[] = [vatMaterial]
  let depthInstancedMesh: THREE.InstancedMesh | undefined

  if (useDepthMaterial) {
    const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData, shaderOverrides, customUniforms)
    depthInstancedMesh = new THREE.InstancedMesh(geometry, vatDepthMaterial, instanceCount)
    materials.push(vatDepthMaterial)
  }

  return { instancedMesh, materials, depthInstancedMesh }
}
