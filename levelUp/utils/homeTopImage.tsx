import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Canvas, Image as SkiaImage, useImage, Fit, FilterMode, MipmapMode } from "@shopify/react-native-skia";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function TopImage() {
  const image = useImage(require('../assets/images/HomeTopImage.png'));


  return (
    <View style={{position: 'absolute', top: screenHeight*0.05, width: screenWidth, height: screenHeight*0.3}}>
        <Canvas style={{flex: 1}}>
          <SkiaImage
            image={image}
            x={0}
            y={-80}
            width={screenWidth}
            height={screenHeight*0.4}
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
