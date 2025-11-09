import { CameraControls } from "@react-three/drei";
import { CanvasCapture } from "@packages/r3f-gist/components/utility";
import EnvironmentSetup from "./EnvironmentSetup";
import Lights from "./Lights";
import Rose from "./Rose";
import Effects from "./Effects";
import InteractivePlane from "./InteractivePlane";
import { IntersectionProvider } from "./IntersectionContext";
import { useLoadedFileCount } from "@packages/r3f-gist/hooks";

export default function Scene() {
    return (
        <IntersectionProvider>
            <color attach="background" args={['#171717']} />
            <Lights />
            <EnvironmentSetup />
            {/* <fogExp2 attach="fog" args={['#000000', 0.05]} /> */}
            <Effects />

            <InteractivePlane />


            {/* <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="white" />
            </mesh> */}

            <CameraControls makeDefault maxDistance={5}/>

            <CanvasCapture />

            <Rose />
        </IntersectionProvider>
    )
}

