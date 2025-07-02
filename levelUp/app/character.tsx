// app/character.tsx
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import CharacterScreen from '../screens/CharacterScreen'; 

export default function SecondPage() {
  const router = useRouter();

  return <CharacterScreen goToHome={() => router.replace('/')} />;
  
}
