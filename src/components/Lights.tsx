export default function Lights() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} intensity={1} />
        </>
    )
}