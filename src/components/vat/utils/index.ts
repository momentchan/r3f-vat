import * as THREE from 'three'
import { VATMeta, SpawnedMeshData } from '../types'

// ========== VAT Geometry Utils ==========

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

// ========== Position Utils ==========

/**
 * Generate random position inside sphere
 */
export function generateSpherePosition(radius: number = 0.5): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = Math.cbrt(Math.random()) * radius
  
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ]
}

/**
 * Check if a position is valid (not too close to existing meshes)
 */
export function isPositionValid(
  position: THREE.Vector3,
  existingMeshes: SpawnedMeshData[],
  minDistance: number = 0.1
): boolean {
  return !existingMeshes.some(mesh => {
    const meshPos = new THREE.Vector3(mesh.position[0], mesh.position[1], mesh.position[2])
    return position.distanceTo(meshPos) < minDistance
  })
}

/**
 * Generate a valid spawn position that doesn't collide with existing meshes
 */
export function generateValidPosition(
  existingMeshes: SpawnedMeshData[],
  radius: number = 0.5,
  minDistance: number = 0.1,
  maxAttempts: number = 50
): THREE.Vector3 | null {
  for (let i = 0; i < maxAttempts; i++) {
    const position = generateSpherePosition(radius)
    const vectorPosition = new THREE.Vector3(position[0], position[1], position[2])
    
    if (isPositionValid(vectorPosition, existingMeshes, minDistance)) {
      return vectorPosition
    }
  }
  return null
}

// ========== Rotation Utils ==========

/**
 * Calculate camera-facing rotation
 */
export function calculateCameraFacingRotation(
  meshPosition: THREE.Vector3,
  cameraPosition: THREE.Vector3,
  offsetAngle: number = 0
): THREE.Quaternion {
  const direction = cameraPosition.clone().sub(meshPosition).normalize()
  
  if (offsetAngle !== 0) {
    const rotationMatrix = new THREE.Matrix4().makeRotationY(offsetAngle)
    direction.applyMatrix4(rotationMatrix)
  }
  
  const up = new THREE.Vector3(0, 1, 0)
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(up, direction)
  
  return quaternion
}

/**
 * Apply random rotation offsets
 */
export function applyRandomRotationOffsets(
  baseQuaternion: THREE.Quaternion,
  xRotationRange: [number, number] = [-45, 45],
  zRotationRange: [number, number] = [-45, 45]
): THREE.Quaternion {
  const randomX = Math.random() * (xRotationRange[1] - xRotationRange[0]) + xRotationRange[0]
  const randomZ = Math.random() * (zRotationRange[1] - zRotationRange[0]) + zRotationRange[0]
  
  const xRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0), 
    THREE.MathUtils.degToRad(randomX)
  )
  const zRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1), 
    THREE.MathUtils.degToRad(randomZ)
  )
  
  const result = baseQuaternion.clone()
  result.multiply(xRotationQuaternion)
  result.multiply(zRotationQuaternion)
  
  return result
}

// ========== Spawner Utils ==========

/**
 * Create unique ID for spawned mesh
 */
export function createSpawnId(counter: number): number {
  return Date.now() + counter + Math.random() * 1000000
}


export function screenToWorldAtDepth(
  pointer: { x: number; y: number },
  camera: THREE.Camera,
  depth: number = 5
): THREE.Vector3 {
  const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5);
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();

  return camera.position.clone().add(dir.multiplyScalar(depth));
}

