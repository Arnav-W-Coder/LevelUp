import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';

type Props = {
  onBack: () => void;
};

//const XP_KEY = 'levelup_xp';

// const getLevelFromXp = (xp: number, level: number) => {
//   let requiredXp = 100;
//   let newLevel = level;

//   while (xp >= requiredXp) {
//     xp -= requiredXp;
//     requiredXp = newLevel * 100;
//     newLevel++;
//   }
  
//   const xpToNextLevel = requiredXp - xp;
//   const xpInLevel = xp;

//   return { xpInLevel, xpToNextLevel };
// };

export default function CharacterScreen( {onBack}: Props ) {
  const { xp, level, addXp, changeLevel, changeXp } = useXP();

  return (
    <View style={styles.container}>
      <Button title="Go to Home Screen" onPress={onBack} />
      <Button
      title="Reset XP/Level (Dev Only)"
      onPress={async () => {
        changeXp([0, 0, 0, 0]);
        changeLevel([0, 0, 0, 0]);
        await AsyncStorage.removeItem('levelup_xp');
        await AsyncStorage.removeItem('levelup_level');
        console.log('XP and level reset');
        }}/>
      <Text style={styles.title}>Your Character</Text>
      <Text style={styles.stat}>Level: {level}</Text>
      <View style={styles.grid}>
        <Text style={styles.stat}>Mind XP: {xp[0]} / {100}</Text>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${(xp[0] / 100) * 100}%` }]} />
        </View>
        <Text style={styles.stat}>Body XP: {xp[1]} / {100}</Text>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${(xp[1] / 100) * 100}%` }]} />
        </View>
        <Text style={styles.stat}>Spirit XP: {xp[2]} / {100}</Text>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${(xp[2] / 100) * 100}%` }]} />
        </View>
        <Text style={styles.stat}>Accountability XP: {xp[3]} / {100}</Text>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${(xp[3] / 100) * 100}%` }]} />
        </View>
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
  stat: { color: '#fff', fontSize: 16, marginVertical: 5 
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // center boxes
    alignItems: 'center',
    paddingHorizontal: 20,     // spacing from screen edges
    rowGap: 15,
    columnGap: 15,
    marginTop: 30,
  },
});
