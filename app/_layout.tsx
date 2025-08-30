//_layout.tsx
import { Stack } from 'expo-router';
import { XPProvider } from '../context/XPContext';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import 'react-native-reanimated';
import { Provider } from 'react-native-paper'


export default function Layout() {
  return (
      <Provider>
        <XPProvider>
          <Stack screenOptions={{ headerShown: false }}/>
        </XPProvider>
      </Provider>
      
  );
}
