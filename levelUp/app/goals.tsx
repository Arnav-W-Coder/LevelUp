import { useRouter } from 'expo-router';
import GoalScreen from "../screens/GoalScreen";

export default function SecondPage() {
  const router = useRouter();

  return <GoalScreen 
    goToHome={() => router.replace('/')} 
    goToDungeon={() => router.replace("/dungeon")}   
    goToCharacter={() => router.replace("/character")} 
  />;
  
}