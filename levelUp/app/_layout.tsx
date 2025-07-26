import { Stack } from 'expo-router';
import { XPProvider } from '../context/XPContext';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}> 
      <XPProvider>
        <Stack screenOptions={{ headerShown: false }}/>
      </XPProvider>
    </GestureHandlerRootView>
  );
}
