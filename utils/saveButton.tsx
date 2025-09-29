import {
  Canvas,
  FilterMode,
  MipmapMode,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import React from "react";
import { Dimensions, Pressable, StyleSheet } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SaveButton({ saveGoals }: { saveGoals: () => void }) {
  const w = 200;
  const h = 100;

  // Load once at top level
  const btnImg = useImage(require("../assets/images/SaveButton2.png"));

  if (!btnImg) return null; // still loading

  return (
    <Pressable
      onPress={saveGoals}
      style={({ pressed }) => [
        {
          position: "absolute",
          top: screenHeight * 0.8,
          left: screenWidth * 0.6
        },
        pressed && styles.buttonPressed,
      ]}
    >
      
      {/* Give Canvas explicit size */}
      <Canvas style={{ width: w, height: h }}>
        <SkiaImage
          image={btnImg}
          x={0}
          y={0}
          width={w}
          height={h}
          sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
        />
      </Canvas>
    </Pressable>
  );
}

const styles = StyleSheet.create(
{
    buttonPressed: {transform: [{ scale: 0.9 }]},
});