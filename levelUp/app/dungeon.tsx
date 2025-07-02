import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import DungeonScreen from '../screens/DungeonScreen'; 

export default function SecondPage() {
  const router = useRouter();

  return <DungeonScreen onBack={() => router.replace('/')} />;
  
}