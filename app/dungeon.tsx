import { useRouter } from 'expo-router';
import DungeonScreen from '../screens/DungeonScreen';

export default function SecondPage() {
  const router = useRouter();

  return (
    <DungeonScreen
        goToHome={() => router.replace('/')}
        goToCharacter={() => router.replace('/character')}
        goToGoal={() => router.replace('/goals')}
        goToDungeon={() => router.replace('/dungeon')}
        goToCalendar={() => router.replace('/calendar')} />
  );
  
}