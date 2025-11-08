import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntersectionUV } from './IntersectionContext';

export default function InteractivePlane() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { raycaster, pointer, camera } = useThree();
    const intersectionUVRef = useIntersectionUV();

    const handlePointerMove = () => {
        if (!meshRef.current) return;

        // Update raycaster with current pointer position
        raycaster.setFromCamera(pointer, camera);
        
        // Perform raycast
        const intersects = raycaster.intersectObject(meshRef.current);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            
            // Get the intersection point in local coordinates
            const localPoint = intersection.point.clone();
            meshRef.current.worldToLocal(localPoint);
            
            // Store intersection UV
            if (intersection.uv) {
                if (!intersectionUVRef.current) {
                    intersectionUVRef.current = new THREE.Vector2();
                }
                intersectionUVRef.current.copy(intersection.uv);
            }
        } else {
            // No intersection, clear the UV
            intersectionUVRef.current = null;
        }
    };

    return (
        <mesh 
            ref={meshRef}
            rotation-x={-Math.PI / 2} 
            receiveShadow
            onPointerMove={handlePointerMove}
        >
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial color="white" />
        </mesh>
    )
}