// Main exports for VAT components
export { VATMesh } from './VATMesh'
export { VATMeshLifecycle } from './VATMeshLifecycle'
export { VATMeshSpawner } from './VATMeshSpawner'
export { AutoSpawner } from './AutoSpawner'
export { InteractiveTrigger } from './InteractiveTrigger'

// Hooks
export { useVATPreloader } from './VATPreloader'
export { 
  useVATAnimation,
  useTriggerRate 
} from './hooks/useVATAnimation'
export {
  useAnimatedValue,
  useAnimatedValues
} from '../hooks/useAnimatedValue'

// Type exports
export type {
  VATMeta,
  VATResources,
  VATMaterialControls,
  VATMeshProps,
  VATMeshLifecycleProps,
  SpawnedMeshData
} from './types'

// Utility exports
export {
  ensureUV2ForVAT,
  generateSpherePosition,
  calculateCameraFacingRotation,
  applyRandomRotationOffsets,
  generateValidPosition,
  isPositionValid,
  createSpawnId
} from './utils'

export {
  setupVATMaterials,
  cloneAndSetupVATScene,
  calculateVATFrame
} from './utils/materialSetup'

// Material exports
export {
  createVATMaterial,
  createVATDepthMaterial,
  updateVATMaterial,
  updatePhysicalProperties,
  updateAdvancedProperties
} from './materials'

// Animation exports
export { 
  createVATLifecycleTimeline,
} from './animations/gsapTimeline'
export type {
  TimelineAnimationConfig,
  AnimationRefs
} from './animations/gsapTimeline'
