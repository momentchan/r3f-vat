import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { VATMeta, VATMaterialControls, VATShaderOverrides } from '../types'
import { VAT_VERTEX_SHADER, VAT_FRAGMENT_SHADER } from '../shaders'

// Create VAT material with custom shaders
export function createVATMaterial(
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  meta: VATMeta,
  materialProps: VATMaterialControls,
  shaderOverrides?: VATShaderOverrides,
  customUniforms?: Record<string, any>
): CustomShaderMaterial {
  const uniforms = {
    uPosTex: { value: posTex },
    uNrmTex: { value: nrmTex },
    uFrame: { value: 0.0 },
    uFrames: { value: meta.frameCount },
    uTexW: { value: meta.texWidth },
    uStoreDelta: { value: meta.storeDelta ? 1 : 0 },
    uNormalsCompressed: { value: meta.normalsCompressed ? 1 : 0 },
    ...(customUniforms || {})
  }

  // Only pass valid Three.js material properties
  const threeJsMaterialProps = {
    roughness: materialProps.roughness,
    metalness: materialProps.metalness,
    transmission: materialProps.transmission,
    thickness: materialProps.thickness,
    ior: materialProps.ior,
    clearcoat: materialProps.clearcoat,
    clearcoatRoughness: materialProps.clearcoatRoughness,
    reflectivity: materialProps.reflectivity,
    envMapIntensity: materialProps.envMapIntensity,
    sheen: materialProps.sheen,
    sheenRoughness: materialProps.sheenRoughness,
    sheenColor: new THREE.Color(materialProps.sheenColor),
    iridescence: materialProps.iridescence,
    iridescenceIOR: materialProps.iridescenceIOR,
    iridescenceThicknessRange: [materialProps.iridescenceThicknessMin, materialProps.iridescenceThicknessMax] as [number, number],
    attenuationDistance: materialProps.attenuationDistance,
    attenuationColor: new THREE.Color(materialProps.attenuationColor),
    bumpScale: materialProps.bumpScale,
  }

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: shaderOverrides?.vertexShader || VAT_VERTEX_SHADER,
    fragmentShader: shaderOverrides?.fragmentShader || VAT_FRAGMENT_SHADER,
    transparent: true,
    uniforms,
    envMap: envMap,
    side: THREE.DoubleSide,
    ...threeJsMaterialProps,
  })
}

// Create VAT depth material for shadow casting
export function createVATDepthMaterial(
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  meta: VATMeta,
  shaderOverrides?: VATShaderOverrides,
  customUniforms?: Record<string, any>
): CustomShaderMaterial {
  const uniforms = {
    uPosTex: { value: posTex },
    uNrmTex: { value: nrmTex },
    uFrame: { value: 0.0 },
    uFrames: { value: meta.frameCount },
    uTexW: { value: meta.texWidth },
    uStoreDelta: { value: meta.storeDelta ? 1 : 0 },
    uNormalsCompressed: { value: meta.normalsCompressed ? 1 : 0 },
    ...(customUniforms || {})
  }

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: shaderOverrides?.depthVertexShader || shaderOverrides?.vertexShader || VAT_VERTEX_SHADER,
    uniforms,
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  })
}

