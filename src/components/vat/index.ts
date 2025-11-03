// Main exports for VAT components
export { VATMesh } from './VATMesh'
export { VATInstancedMesh } from './VATInstancedMesh'

// Hooks
export { useVATPreloader } from './VATPreloader'

// Type exports
export type {
  VATMeta,
  VATMaterialControls,
  VATMeshProps,
} from './types'
export type { VATInstancedMeshProps } from './VATInstancedMesh'

// Utility exports
export {
  ensureUV2ForVAT,
  calculateVATFrame,
  setupVATMaterials,
  cloneAndSetupVATScene,
  extractGeometryFromScene,
  createVATInstancedMesh
} from './utils'

// Material exports
export {
  createVATMaterial,
  createVATDepthMaterial
} from './materials'
