import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stats } from "@react-three/drei";
import './threejs-viewer.css'



interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  console.log("Model URL:", url);
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

interface ThreeJSViewerProps {
  modelUrl: string;
}

export default function ThreeJSViewer({ modelUrl }: ThreeJSViewerProps) {
    console.log("ThreeJSViewer modelUrl:", modelUrl);
    return (
      <div className="canvas-container">
        <Canvas style={{ height: "100%" }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={20} />
          <directionalLight position={[-5, 5, 5]} intensity={20} />
          <directionalLight position={[5, -5, 5]} intensity={20} />
          <directionalLight position={[5, 5, -5]} intensity={20} />
          <pointLight position={[0, 0, 0]} intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <Suspense fallback={null}>
            {modelUrl ? <Model url={modelUrl} /> : null}
          </Suspense>
          <OrbitControls /> 
          {/* orbitcontols minmax zoom TOTO */}
        </Canvas>
        <Stats  /> 
      </div>
    );
  }