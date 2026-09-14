import React, { Component } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("ShaderGradient Canvas fallback:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 160px, rgba(0, 242, 152, 0.08) 0%, transparent 60%), #080b10'
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default function ShaderBg() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none overflow-hidden bg-fx-bg">
        <ShaderGradientCanvas
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          lazyLoad={false}
        >
          <ShaderGradient
            animate="on"
            axesHelper="off"
            bgColor1="#000000"
            bgColor2="#000000"
            brightness={0.6}
            cAzimuthAngle={180}
            cDistance={3.61}
            cPolarAngle={90}
            cameraZoom={1}
            color1="#00F298"
            color2="#0E7490"
            color3="#0C1E28"
            destination="onCanvas"
            embedMode="off"
            envPreset="city"
            format="gif"
            fov={20}
            frameRate={10}
            gizmoHelper="hide"
            grain="off"
            lightType="3d"
            pixelDensity={1}
            positionX={-1.4}
            positionY={0}
            positionZ={0}
            range="enabled"
            rangeEnd={20.1}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={10}
            rotationZ={50}
            shader="defaults"
            type="waterPlane"
            uAmplitude={1}
            uDensity={1.3}
            uFrequency={5.5}
            uSpeed={0.1}
            uStrength={4}
            uTime={0}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>
    </ErrorBoundary>
  );
}
