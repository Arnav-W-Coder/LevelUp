import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useXP } from '../context/XPContext';

type Props = {
  onBack: () => void;
};


export default function DungeonScreen({onBack}:Props) {
  const {level} = useXP();

  const [currentDungeon, setCurrentDungeon] = useState(1);
  const characterLevel = level;

  const advanceDungeon = () => {
    setCurrentDungeon((prev) => prev + 1);
  };

  const levelRequired = currentDungeon * 2;

  const canEnter = characterLevel >= levelRequired;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dungeon Level {currentDungeon}</Text>
      <Button title="Go back to homescreen" onPress={onBack} />
      {/* Dungeon sprite placeholder */}
      <Image
        source={require('../assets/images/testMap.png')} // add pixel-style dungeon image
        style={styles.image}
      />

      <Text style={styles.levelInfo}>
        Required Level: {levelRequired}
      </Text>
      <Text style={styles.playerInfo}>
        Your Level: {characterLevel}
      </Text>

      {canEnter ? (
        <Button title="Advance to Next Dungeon" onPress={advanceDungeon} />
      ) : (
        <Text style={styles.locked}>You can access the next level!!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#1b1b1b', alignItems: 'center' },
  title: { fontSize: 28, color: '#fff', marginBottom: 20 },
  image: { width: 150, height: 150, marginBottom: 20 },
  levelInfo: { fontSize: 16, color: '#aaa' },
  playerInfo: { fontSize: 16, color: '#0f0', marginBottom: 20 },
  locked: { marginTop: 10, color: '#f33', fontWeight: 'bold' },
});
