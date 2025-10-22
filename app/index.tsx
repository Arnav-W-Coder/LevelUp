// app/index.tsx
import { useRouter } from 'expo-router';
import HomeScreen from "../screens/HomeScreen";

export default function app() {
  const router = useRouter();

  return (
      <HomeScreen 
        goToCharacter={() => router.replace('/character')} 
        goToDungeon={() => router.replace("/dungeon")} 
        goToGoal={() => router.replace("/goals")}
        goToHome={() => router.replace('/')} 
        goToCalendar={() => router.replace('/calendar')} />
  );
}
