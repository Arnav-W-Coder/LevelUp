import { useRouter } from 'expo-router';
import GoalScreen from "../screens/GoalScreen";

export default function SecondPage() {
  const router = useRouter();

  return <GoalScreen 
    goToHome={() => router.back()} 
    goToDungeon={() => router.push("./dungeon")}   
    goToCharacter={() => router.push("./character")} 
  />;
  
}