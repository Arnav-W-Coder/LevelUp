import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';

type Props = {
  onBack: () => void;
};

export default function CharacterScreen( {onBack}: Props ) {
  const character = {
    name: 'Pixel Warrior',
    level: 3,
    xp: 120,
    xpToNextLevel: 200,
    stats: {
      strength: 5,
      agility: 4,
      intelligence: 6,
    },
  };

  const xpProgress = (character.xp / character.xpToNextLevel) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{character.name}</Text>
      <Button title="Go back to homescreen" onPress={onBack} />
      {/* Character Sprite Placeholder */}
      <Image
        source={require('../assets/images/testCharacter.png')} // add a pixel-style character image here
        style={styles.image}
      />

      <Text style={styles.level}>Level: {character.level}</Text>
      <View style={styles.xpBarBackground}>
        <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
      </View>
      <Text style={styles.xpText}>{character.xp} / {character.xpToNextLevel} XP</Text>

      <View style={styles.statsContainer}>
        <Text style={styles.stat}>🗡️ Strength: {character.stats.strength}</Text>
        <Text style={styles.stat}>🏃 Agility: {character.stats.agility}</Text>
        <Text style={styles.stat}>🧠 Intelligence: {character.stats.intelligence}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#1c1c1c', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  image: { width: 100, height: 100, marginBottom: 20 },
  level: { fontSize: 18, color: '#0f0' },
  xpBarBackground: {
    width: '80%',
    height: 20,
    backgroundColor: '#444',
    borderRadius: 10,
    marginTop: 10,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#0f0',
    borderRadius: 10,
  },
  xpText: { color: '#aaa', marginTop: 5 },
  statsContainer: { marginTop: 30 },
  stat: { color: '#fff', fontSize: 16, marginVertical: 5 },
});
