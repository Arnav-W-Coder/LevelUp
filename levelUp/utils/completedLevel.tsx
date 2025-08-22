import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Canvas, Image as SkiaImage, useImage, Fit, FilterMode, MipmapMode } from "@shopify/react-native-skia";

type LevelProps = {
  topOffset: number;
  leftOffset: number;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CompletedLevel({ topOffset, leftOffset }: LevelProps) {
  const image = useImage(require("../assets/images/CompletedLevel.png"));

  return (
    <View
      style={[
        styles.level,
        {
          top: topOffset,
          left: leftOffset,
        },
      ]}
    >
        <Canvas style={{ width: 160, height: 160 }}>
          <SkiaImage
            image={image}
            x={0}
            y={0}
            width={160}
            height={160}
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
