import React from "react";
import {View, Text, StyleSheet} from "react-native";
import { Pressable, Dimensions } from "react-native";
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  FilterMode,
  MipmapMode,
} from "@shopify/react-native-skia";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SaveButton({ saveGoals }: { saveGoals: () => void }) {
  const w = 200;
  const h = 100;

  // Load once at top level
  const btnImg = useImage(require("../assets/images/SaveButton1.png"));

  if (!btnImg) return null; // still loading

  return (
    <Pressable
      onPress={saveGoals}
      style={({ pressed }) => [
        {
          position: "absolute",
          top: screenHeight * 0.4,
          left: screenWidth * 0.5 - w/2,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={{position: 'absolute', top: 20, left: 50, width: w/2, height: h/2 + 5, backgroundColor: "rgba(45, 155, 240, 1)", alignItems: 'center'}}>
        <Text style={{color: 'rgba(31, 31, 31, 1)', top: 12, fontSize: 25, fontWeight: '500'}}>Save</Text>
      </View>
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