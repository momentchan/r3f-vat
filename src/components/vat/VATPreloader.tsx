import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { TextureLoader } from 'three'

// Helper function to get the appropriate loader for file extension
function getLoaderForExtension(url: string) {
  const ext = url.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'exr':
      return EXRLoader
    case 'png':
    case 'jpg':
    case 'jpeg':
    default:
      return TextureLoader
  }
}

// Helper function to configure EXR loader
function configureEXRLoader(loader: any) {
  if (loader.constructor.name === 'EXRLoader') {
    loader.setDataType(THREE.FloatType)
  }
}

// Hook to preload VAT resources
// Supports FBX, GLTF, and GLB files
export function useVATPreloader(meshPath: string, pos: string, nrm?: string | null, metaUrl?: string) {
  // Determine mesh type based on file extension
  const ext = meshPath.split('.').pop()?.toLowerCase()
  const isFBX = ext === 'fbx'
  // useGLTF from @react-three/drei supports both .gltf and .glb files
  
  // Load mesh using appropriate loader
  // Note: This conditionally calls hooks, which technically violates React's rules.
  // However, since meshPath is a prop and typically doesn't change during component lifetime,
  // this works in practice. If meshPath changes dynamically, consider using separate hooks
  // or a factory pattern to ensure hooks are always called in the same order.
  const fbxScene = isFBX ? (useLoader(FBXLoader, meshPath) as THREE.Group) : null
  // useGLTF handles both .gltf and .glb file formats
  const gltf = !isFBX ? useGLTF(meshPath) : null
  
  // Select the appropriate scene
  const scene = isFBX ? fbxScene! : (gltf?.scene || null)

  const posTex = useLoader(getLoaderForExtension(pos), pos, configureEXRLoader)
  const nrmTex = useLoader(getLoaderForExtension(nrm || pos), nrm || pos, configureEXRLoader)

  const metaResponse = useLoader(THREE.FileLoader, metaUrl || 'data:application/json,{}')
  const meta = useMemo(() => {
    return metaResponse ? JSON.parse(metaResponse as string) : null
  }, [metaResponse])

  return {
    scene,
    posTex,
    nrmTex: nrm ? nrmTex : null,
    meta: metaUrl ? meta : null,
    isLoaded: !!(scene && posTex && (!nrm || nrmTex) && (!metaUrl || meta))
  }
}
