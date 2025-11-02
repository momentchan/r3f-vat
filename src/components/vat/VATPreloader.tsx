import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
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
export function useVATPreloader(gltfPath: string, pos: string, nrm?: string | null, metaUrl?: string) {
  const gltf = useGLTF(gltfPath)
  const posTex = useLoader(getLoaderForExtension(pos), pos, configureEXRLoader)
  const nrmTex = useLoader(getLoaderForExtension(nrm || pos), nrm || pos, configureEXRLoader)

  const metaResponse = useLoader(THREE.FileLoader, metaUrl || 'data:application/json,{}')
  const meta = metaResponse ? JSON.parse(metaResponse as string) : null

  return {
    gltf,
    posTex,
    nrmTex: nrm ? nrmTex : null,
    meta: metaUrl ? meta : null,
    isLoaded: !!(gltf && posTex && (!nrm || nrmTex) && (!metaUrl || meta))
  }
}
