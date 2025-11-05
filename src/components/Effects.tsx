import { Bloom, EffectComposer, SMAA, ToneMapping } from "@react-three/postprocessing";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { ToneMappingMode, EffectComposer as EffectComposerImpl } from 'postprocessing';
import { N8AO } from "@react-three/postprocessing";
import { useControls } from "leva";

export default function Effects() {
    const composer = useRef<EffectComposerImpl | null>(null);

    // Leva controls for post-processing effects
    const effectsControls = useControls('Effects', {
        toneMapping: {
            value: ToneMappingMode.ACES_FILMIC,
            options: {
                'ACES Filmic': ToneMappingMode.ACES_FILMIC,
                'Neutral': ToneMappingMode.NEUTRAL,
                'Reinhard': ToneMappingMode.REINHARD,
                'Cineon': ToneMappingMode.CINEON,
                'Linear': ToneMappingMode.LINEAR,
            },
            label: 'Tone Mapping'
        },
        enableBloom: { value: false, label: 'Enable Bloom' },
        bloomIntensity: { value: 1, min: 0, max: 5, step: 0.1, label: 'Bloom Intensity' },
        bloomThreshold: { value: 0.2, min: 0, max: 2, step: 0.1, label: 'Bloom Threshold' },
        bloomSmoothing: { value: 0.5, min: 0, max: 1, step: 0.1, label: 'Bloom Smoothing' },
        enableSMAA: { value: false, label: 'Enable SMAA' },
        enableN8AO: { value: false, label: 'Enable N8AO' },
        aoRadius: { value: 2, min: 0, max: 10, step: 0.1, label: 'AO Radius' },
        aoIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: 'AO Intensity' },
        aoSamples: { value: 6, min: 1, max: 32, step: 1, label: 'AO Samples' },
        denoiseSamples: { value: 4, min: 1, max: 16, step: 1, label: 'Denoise Samples' },
        distanceFalloff: { value: 1, min: 0, max: 10, step: 0.1, label: 'Distance Falloff' },
    }, { collapsed: true })

    const effects = useMemo(() => {
        const effectsList = [
            <ToneMapping key="toneMapping" mode={effectsControls.toneMapping} />
        ];

        if (effectsControls.enableBloom) {
            effectsList.push(
                <Bloom
                    key="bloom"
                    luminanceThreshold={effectsControls.bloomThreshold}
                    luminanceSmoothing={effectsControls.bloomSmoothing}
                    mipmapBlur
                    intensity={effectsControls.bloomIntensity}
                />
            );
        }

        if (effectsControls.enableN8AO) {
            effectsList.push(
                <N8AO
                    key="n8ao"
                    aoRadius={effectsControls.aoRadius}
                    intensity={effectsControls.aoIntensity}
                    aoSamples={effectsControls.aoSamples}
                    denoiseSamples={effectsControls.denoiseSamples}
                />
            );
        }

        if (effectsControls.enableSMAA) {
            effectsList.push(<SMAA key="smaa" />);
        }

        return effectsList;
    }, [effectsControls]);

    return (
        <EffectComposer
            ref={composer}
            multisampling={0}
            resolutionScale={1}
            frameBufferType={THREE.HalfFloatType}
            enableNormalPass={false}
        >
            {effects}
        </EffectComposer>
    )
}