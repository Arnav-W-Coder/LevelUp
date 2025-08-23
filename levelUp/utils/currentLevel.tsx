import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Canvas, Image as SkiaImage, useImage, Fit, FilterMode, MipmapMode, SkImage } from "@shopify/react-native-skia";

type LevelProps = {
  topOffset: number;
  leftOffset: number;
  image: SkImage | null;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function CurrentLevelBase({ topOffset, leftOffset, image }: LevelProps){

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
        <Canvas style={{ width: 200, height: 200 }}>
          <SkiaImage
            image={image}
            x={0}
            y={0}
            width={130}
            height={130}
            sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }}
          />
        </Canvas>
      
    </View>
  );
}
const CurrentLevel = React.memo(CurrentLevelBase);
export default CurrentLevel;

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
