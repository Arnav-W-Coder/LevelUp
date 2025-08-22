import React, { useEffect, useState, useMemo } from "react";
import { Dimensions } from "react-native";
import { Canvas, rrect, Image as SkiaImage, useImage, Group, Skia} from "@shopify/react-native-skia";
import {useXP} from '../context/XPContext'

type LevelProps = {
  topOffset: number;
  leftOffset: number;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function CharacterImage({ topOffset, leftOffset }: LevelProps) {
  const { dungeonLevel } = useXP();
  const frameCount = 2;
  const [currentFrame, setCurrentFrame] = useState(0);

  // Decide which asset to load
  const spriteSource = useMemo(() => {
    if (dungeonLevel <= 25) {
      return require("../assets/images/testGif.png");
    } else if (dungeonLevel <= 50) {
      return require("../assets/images/StageTwoCharacter.png");
    } else {
      return require("../assets/images/StageThreeCharacter.png");
    }
  }, [dungeonLevel]);

  // Load once
  const spriteSheet = useImage(spriteSource);

  // Animate frame every 200ms (5 fps)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frameCount);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!spriteSheet) return null;

  const frameWidth = spriteSheet.width() / frameCount;
  const frameHeight = spriteSheet.height();

  return (
    <Canvas style={{flex: 1}}>
        <SkiaImage
          image={spriteSheet}
          x={0}
          y={0}
          width={frameWidth * 2} // scale here
          height={frameHeight * 2}
          rect={{
            x: currentFrame * frameWidth,
            y: 0,
            width: frameWidth,
            height: frameHeight,
          }}
        />
    </Canvas>
  );
}
