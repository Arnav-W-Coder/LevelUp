// app/index.tsx
import { View, Text } from 'react-native';
import HomeScreen from "../screens/HomeScreen";
import { useRouter } from 'expo-router';

export default function app() {
  const router = useRouter();

  return (
      <HomeScreen 
        goToCharacter={() => router.replace('/character')} 
        goToDungeon={() => router.replace("/dungeon")} 
        goToGoal={() => router.replace("/goals")}
        goToHome={() => router.replace('/')} />
  );
}
