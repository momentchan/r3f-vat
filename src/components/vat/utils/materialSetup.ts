import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { VATMeta } from '../types'
import { createVATMaterial, createVATDepthMaterial } from '../materials'
import { ensureUV2ForVAT } from './index'

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
  manual?: boolean
): CustomShaderMaterial[] {
  const materials: CustomShaderMaterial[] = []

  ensureUV2ForVAT(mesh.geometry, metaData)

  const vatMaterial = createVATMaterial(posTex, nrmTex, envMap, metaData, materialControls, manual)
  mesh.material = vatMaterial

  materials.push(vatMaterial)

  if (useDepthMaterial) {
    const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData, manual)
    mesh.customDepthMaterial = vatDepthMaterial
    materials.push(vatDepthMaterial)
  }

  // mesh.castShadow = true
  // mesh.receiveShadow = true
  mesh.frustumCulled = false

  return materials
}

/**
 * Clone and setup VAT scene with materials
 */
export function cloneAndSetupVATScene(
  gltf: THREE.Group,
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  metaData: VATMeta,
  materialControls: any,
  useDepthMaterial: boolean,
  manual?: boolean
): {
  scene: THREE.Group
  materials: CustomShaderMaterial[]
  mesh: THREE.Mesh | null
} {
  const clonedScene = gltf.clone()
  const materials: CustomShaderMaterial[] = []
  let vatMesh: THREE.Mesh | null = null

  clonedScene.traverse((object: any) => {
    if (object.isMesh) {
      const mesh = object as THREE.Mesh
      const meshMaterials = setupVATMaterials(
        mesh, posTex, nrmTex, envMap, metaData, materialControls, useDepthMaterial, manual
      )
      materials.push(...meshMaterials)
      vatMesh = mesh
    }
  })
  
  return { scene: clonedScene, materials, mesh: vatMesh }
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
