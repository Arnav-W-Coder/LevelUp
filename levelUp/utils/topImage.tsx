import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Canvas, Image as SkiaImage, useImage, Fit, FilterMode, MipmapMode } from "@shopify/react-native-skia";

type LevelProps = {
  topOffset: number;
  leftOffset: number;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TopImage({ topOffset, leftOffset }: LevelProps) {
  const image = useImage(require('../assets/images/DungeonTopImage.png'));

  return (
    <View
      style={{width: screenWidth, height: screenHeight * 0.3}}
    >
        <Canvas style={{flex: 1, margin: 0, padding: 0}}>
          <SkiaImage
            image={image}
            x={0}
            y={0}
            width={1536 * 0.25}
            height={1024 * 0.25}
            sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }}
          />
        </Canvas>
      
    </View>
  );
}

const styles = StyleSheet.create({
  level: {
    position: "absolute",
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
});
