import * as THREE from 'three'
import React, { useRef, useEffect, useMemo } from 'react'
import { useControls } from 'leva'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { DEFAULT_VAT_MATERIAL, VATShaderOverrides, VATMeta } from './types'
import { calculateVATFrame } from './utils'

/**
 * Shared Leva controls configuration
 */
const LEVA_MATERIAL_CONTROLS = {
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
} as const

/**
 * Hook for VAT material controls with Leva
 */
export function useVATMaterialControls(
  label: string,
  materialConfig?: Partial<typeof DEFAULT_VAT_MATERIAL>
) {
  // Merge materialConfig into control definitions as initial values
  const controlsWithInitials = useMemo(() => {
    if (!materialConfig) return LEVA_MATERIAL_CONTROLS

    const merged: Record<string, any> = { ...LEVA_MATERIAL_CONTROLS }
    for (const [key, value] of Object.entries(materialConfig)) {
      if (key in merged) {
        const control = merged[key]
        if (typeof control === 'object' && control !== null && 'value' in control) {
          // Merge into existing control object
          merged[key] = {
            ...control,
            value,
          }
        } else {
          // Simple value override
          merged[key] = value
        }
      }
    }
    return merged
  }, [materialConfig])

  const levaControls = useControls(label, controlsWithInitials, { collapsed: true })

  const materialControls = useMemo(
    () => ({ ...DEFAULT_VAT_MATERIAL, ...levaControls }),
    [levaControls]
  )

  return materialControls
}

/**
 * Hook to create a stable shader code key that only changes when shader CODE changes
 */
export function useShaderCodeKey(shaders?: VATShaderOverrides): string {
  const vertexShaderCode = shaders?.vertexShader
  const fragmentShaderCode = shaders?.fragmentShader
  const depthVertexShaderCode = shaders?.depthVertexShader

  return useMemo(() => {
    return `${vertexShaderCode || ''}|${fragmentShaderCode || ''}|${depthVertexShaderCode || ''}`
  }, [vertexShaderCode, fragmentShaderCode, depthVertexShaderCode])
}

/**
 * Hook to stabilize a ref value (prevents unnecessary recreations)
 */
export function useStableRef<T>(value: T | undefined): React.MutableRefObject<T | undefined> {
  const ref = useRef<T | undefined>(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/**
 * Hook to update custom uniforms on materials
 */
export function useUpdateCustomUniforms(
  materialsRef: React.MutableRefObject<CustomShaderMaterial[]>,
  customUniforms?: Record<string, any>
) {
  useEffect(() => {
    if (!customUniforms) return

    for (const material of materialsRef.current) {
      if (material.uniforms) {
        for (const [key, uniform] of Object.entries(customUniforms)) {
          if (material.uniforms[key] && uniform && typeof uniform === 'object' && 'value' in uniform) {
            const existingUniform = material.uniforms[key]
            const newValue = uniform.value

            // Handle THREE.Color
            if (newValue?.isColor && existingUniform.value?.isColor) {
              existingUniform.value.copy(newValue)
            }
            // Handle THREE.Vector3
            else if (newValue?.isVector3 && existingUniform.value?.isVector3) {
              existingUniform.value.copy(newValue)
            }
            // Handle THREE.Texture
            else if (newValue instanceof THREE.Texture) {
              existingUniform.value = newValue
            }
            // Handle primitive values (numbers, arrays, etc.)
            else {
              existingUniform.value = newValue
            }
          }
        }
        material.needsUpdate = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customUniforms])
}

/**
 * Hook to update material properties from controls
 */
export function useUpdateMaterialProperties(
  materialsRef: React.MutableRefObject<CustomShaderMaterial[]>,
  materialControls: typeof DEFAULT_VAT_MATERIAL
) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialControls])
}

/**
 * Hook to update VAT frame uniform on each frame
 */
export function useVATFrame(
  materialsRef: React.MutableRefObject<CustomShaderMaterial[]>,
  metaData: VATMeta,
  vatSpeed: number,
  frameRatio: number | undefined,
  paused: boolean
) {
  useFrame((state) => {
    if (paused) return

    const frame = calculateVATFrame(frameRatio, state.clock.elapsedTime, metaData, vatSpeed)

    for (const material of materialsRef.current) {
      if (material.uniforms?.uFrame) {
        material.uniforms.uFrame.value = frame
      }
    }
  })
}
