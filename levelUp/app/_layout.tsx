import { Stack } from 'expo-router';
import { XPProvider } from '../context/XPContext';

export default function Layout() {
  return (
    <XPProvider>
      <Stack />
    </XPProvider>
  );
}
