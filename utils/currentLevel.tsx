import { Canvas, FilterMode, MipmapMode, Image as SkiaImage, SkImage } from "@shopify/react-native-skia";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

type LevelProps = {
  topOffset: number;
  leftOffset: number;
  image: SkImage | null;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function CurrentLevelBase({ topOffset, leftOffset, image }: LevelProps){

  if(!image){
    return null;
  }

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
