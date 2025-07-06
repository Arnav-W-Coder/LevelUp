import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useXP } from '../context/XPContext';
import Menu from '../utils/menu'

type Props = {
  goToHome: () => void;
  goToCharacter: () => void;
  goToGoal: () => void;
  goToDungeon: () => void;

};


export default function DungeonScreen({ goToHome, goToCharacter, goToGoal, goToDungeon }:Props) {
  const { xp, level } = useXP();
  const [currentDungeon, setCurrentDungeon] = useState(0);

  const advanceDungeon = () => {
    setCurrentDungeon((prev) => prev + 1);
  };

  const canEnterDungeonLevel = () => {
    const requiredLevel = 2 * currentDungeon;
    return (
      level[0] >= requiredLevel &&
      level[1] >= requiredLevel &&
      level[2] >= requiredLevel &&
      level[3] >= requiredLevel
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dungeon Level {currentDungeon}</Text>
      {/* Dungeon sprite placeholder */}
      <Image
        source={require('../assets/images/testMap.png')} // add pixel-style dungeon image
        style={styles.image}
      />

      <Text style={styles.levelInfo}>
        Required Level: {currentDungeon * 2}
      </Text>

      {canEnterDungeonLevel() ? (
        <Button title="Advance to Next Dungeon" onPress={advanceDungeon} />
      ) : (
        <Text style={styles.locked}>You're too low level!!</Text>
      )}
      <Menu goToHome={goToHome} goToGoal={goToGoal} goToDungeon={goToDungeon} goToCharacter={goToCharacter} />
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
