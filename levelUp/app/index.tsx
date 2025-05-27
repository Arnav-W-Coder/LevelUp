// app/index.tsx
import { View, Text } from 'react-native';
import HomeScreen from "../screens/HomeScreen";
import { useRouter } from 'expo-router';

export default function app() {
  const router = useRouter();

  return (
    <HomeScreen 
    goToCharacter={() => router.push('./character')} 
    goToDungeon={() => router.push("./dungeon")} />
  );
}
