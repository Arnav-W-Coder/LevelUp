import { useRouter } from 'expo-router';
import GoalCalendar from '../screens/Calendar';

export default function SecondPage() {
  const router = useRouter();

  return( 
    <GoalCalendar goToHome={() => router.replace('/')} 
      goToCharacter={() => router.replace('/character')} 
      goToGoal={() => router.replace('/goals')} 
      goToDungeon={() => router.replace('/dungeon')} 
      goToCalendar={() => router.replace('/calendar')} />
  );
}