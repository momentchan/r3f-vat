import { AdaptiveDpr, CameraControls, useGLTF, useTexture } from "@react-three/drei";
import { CanvasCapture } from "@packages/r3f-gist/components/utility";
import BasicMesh from '../components/BasicMesh'
import { LevaWrapper } from "@packages/r3f-gist/components";
import { Canvas } from "@react-three/fiber";
import { useVATPreloader } from "../components/vat/VATPreloader";
import { VATMesh } from "../components/vat/VATMesh";
import EnvironmentSetup from "../components/EnvironmentSetup";
import Lights from "../components/Lights";


export default function App() {

    const { gltf, posTex, nrmTex, meta, isLoaded } = useVATPreloader(
        '/vat/Rose_fixed_basisMesh.gltf',
        '/vat/Rose_fixed_pos.exr',
        '/vat/Rose_fixed_nrm.png',
        '/vat/Rose_fixed_meta.json')

    return <>
        <LevaWrapper />

        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [0, 0, 5]
            }}
            gl={{ preserveDrawingBuffer: true }}
            dpr={[1, 2]}
            performance={{ min: 0.5, max: 1 }}
        >
            <color attach="background" args={['#000000']} />
            <Lights />
            <AdaptiveDpr pixelated />

            <EnvironmentSetup />

            <CameraControls makeDefault />
            <CanvasCapture />
            {isLoaded && (
                <VATMesh
                    gltf={gltf.scene}
                    posTex={posTex}
                    nrmTex={nrmTex}
                    metaData={meta}
                />
            )}
        </Canvas>
    </>
}
