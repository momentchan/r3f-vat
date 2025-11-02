import * as THREE from 'three'

// Core VAT metadata interface
export interface VATMeta {
  vertexCount: number
  frameCount: number
  fps: number
  texWidth: number
  texHeight: number
  columns: number
  frameStride: number
  storeDelta: boolean
  normalsCompressed: boolean
}

// VAT resource bundle
export interface VATResources {
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex: THREE.Texture | null
  meta: VATMeta
  refCount: number
}

// Material controls interface
export interface VATMaterialControls {
  roughness: number
  metalness: number
  transmission: number
  thickness: number
  ior: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  envMapIntensity: number
  sheen: number
  sheenRoughness: number
  sheenColor: string
  iridescence: number
  iridescenceIOR: number
  iridescenceThicknessMin: number
  iridescenceThicknessMax: number
  attenuationDistance: number
  attenuationColor: string
  bumpScale: number
  noiseScale: number
  noiseStrength: number
  speed: number
}

// Common VAT props shared across components
export interface CommonVATProps {
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex?: THREE.Texture | null
  metaData: VATMeta
  position?: [number, number, number]
  id?: string | number
}

// VATMesh props interface
export interface VATMeshProps extends CommonVATProps {
  manual?: boolean
  vatSpeed?: number
  paused?: boolean
  useDepthMaterial?: boolean
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  frameRatio?: number
}

// Lifecycle animation timing
export interface LifecycleTimingProps {
  maxScale?: number
  frameForwardDuration?: number
  frameHoldDuration?: number
  frameBackwardDuration?: number
  scaleInDuration?: number
  scaleOutDuration?: number
  rotateInDuration?: number
  rotateOutDuration?: number
}

// VATMeshLifecycle props interface
export interface VATMeshLifecycleProps extends CommonVATProps, LifecycleTimingProps {
  paused?: boolean
  manual?: boolean
  onComplete?: () => void
}

// Spawned mesh data
export interface SpawnedMeshData {
  id: number
  position: [number, number, number]
  scale: number
  holdDuration: number
  animDuration: number
  manual: boolean
}
