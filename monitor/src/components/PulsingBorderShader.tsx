import React from "react";
import { PulsingBorder } from "@paper-design/shaders-react";

interface PulsingBorderShaderProps {
  spots?: number;
  spotSize?: number;
  smokeSize?: number;
  style?: React.CSSProperties;
}

export default function PulsingBorderShader(props: PulsingBorderShaderProps) {
  const { 
    spots = 5,
    spotSize = 0.1,
    smokeSize = 2
  } = props;

  return (
    <PulsingBorder
      colors={["#5800FF", "#BEECFF", "#E77EDC", "#FF4C3E"]}
      colorBack="#00000000"
      speed={1.5}
      roundness={1}
      thickness={0.05}
      softness={0.1}
      intensity={1}
      spots={spots}
      spotSize={spotSize}
      pulse={0.2}
      smoke={0.5}
      smokeSize={smokeSize}
      scale={0.65}
      rotation={0}
      frame={9161408.251009725}
      style={{
        width: "535px",
        height: "511px",
        borderRadius: "0px",
        backgroundImage:
          "radial-gradient(circle in oklab, oklab(0% 0 -.0001 / 0%) 25.22%, oklab(30.5% 0.029 -0.184) 43.89%, oklab(0% 0 -.0001 / 0%) 60.04%)",
        ...props.style,
      }}
    />
  );
}
