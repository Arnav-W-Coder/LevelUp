//_layout.tsx
import { Stack } from 'expo-router';
import { XPProvider } from '../context/XPContext';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import 'react-native-reanimated';


export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <XPProvider>
          <Stack screenOptions={{ headerShown: false }}/>
        </XPProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
