import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Button, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXP } from '../context/XPContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
  goToHome: () => void;
};

export default function CharacterScreen({ goToHome }: Props) {
  const { xp, level, addXp, changeLevel, changeXp } = useXP();
  const [sideBarVisibility, setSideBarVisibility] = useState(true);

  return (
    <View style={styles.screen}>
      <Image source={require('../assets/images/testCharacter.png')} style={styles.characterImage} />

      {/* Left XP Bars */}
      <View style={[styles.xpBar, styles.xpLeft1]}>
        <View style={[styles.xpBarFill, { width: `${(xp[0] / 100) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelMind]}>Mind</Text>
      <Text style={[styles.label, styles.labelMindLevel]}>Level:{level[0]}</Text>

      <View style={[styles.xpBar, styles.xpLeft2]}>
        <View style={[styles.xpBarFill, { width: `${(xp[1] / 100) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelSpirit]}>Spirit</Text>
      <Text style={[styles.label, styles.labelSpiritLevel]}>Level:{level[1]}</Text>

      {/* Right XP Bars */}
      <View style={[styles.xpBar, styles.xpRight1]}>
        <View style={[styles.xpBarFill, { width: `${(xp[2] / 100) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelBody]}>Body</Text>
      <Text style={[styles.label, styles.labelBodyLevel]}>Level:{level[2]}</Text>

      <View style={[styles.xpBar, styles.xpRight2]}> 
        <View style={[styles.xpBarFill, { width: `${(xp[3] / 100) * 100}%` }]}/>
      </View>
      <Text style={[styles.label, styles.labelAccountability]}>Accountability</Text>
      <Text style={[styles.label, styles.labelAccountabilityLevel]}>Level:{level[3]}</Text>

      {/* Sidebar */}
      {sideBarVisibility ? (
        <View>
          <View style={styles.sideBar} />
          <Pressable onPress={async () => {
            changeXp([0, 0, 0, 0]);
            changeLevel([0, 0, 0, 0]);
            await AsyncStorage.removeItem('levelup_xp');
            await AsyncStorage.removeItem('levelup_level');
            console.log('XP and level reset');
          }} style={styles.resetXp} />
          <TouchableOpacity onPress={goToHome} style={styles.sideButton}>
            <Text style={styles.sideLabel}>Homescreen</Text>
          </TouchableOpacity>
          {/* Menu lines */}
          <TouchableOpacity onPress={() => setSideBarVisibility(false)} style={styles.sideLabelBox}>
            <View style={[styles.menuLine1, {marginBottom: screenHeight*0.022}]} />
            <View style={[styles.menuLine2, {marginBottom: screenHeight*0.022}]} />
            <View style={styles.menuLine3} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setSideBarVisibility(true)}>
          <View style={styles.hiddenSideButton} />
          <View style={styles.hiddenMenuLine1} />
          <View style={styles.hiddenMenuLine2} />
          <View style={styles.hiddenMenuLine3} />
        </TouchableOpacity>
      )}
    </View>

  );
}

const styles = StyleSheet.create({
  topSpace: {
    height: '20%', // Leave this space open for visuals
  },
  image: { width: 100, height: 100, marginBottom: 20 },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#0f0',
    borderRadius: 10,
  },
  screen: {
    flex: 1,
    backgroundColor: '#363030',
  },
  xpBar: {
    position: 'absolute',
    width: screenWidth * 0.25,
    height: screenHeight * 0.015,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  characterImage: {
    position: 'absolute',
    width: screenWidth * 0.22,
    height: screenWidth * 0.22,
    top: screenHeight * 0.06,
    left: screenWidth * 0.5 - (screenWidth * 0.22) / 2,
    resizeMode: 'contain',
  },
  label: {
    position: 'absolute',
    fontSize: screenWidth * 0.02,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  // Positioning labels and bars
  xpLeft1: { top: screenHeight * 0.5, left: screenWidth * 0.115 },
  xpLeft2: { top: screenHeight * 0.71, left: screenWidth * 0.115 },
  xpRight1: { top: screenHeight * 0.5, left: screenWidth * 0.57 },
  xpRight2: { top: screenHeight * 0.71, left: screenWidth * 0.57 },

  labelMind: { top: screenHeight * 0.45, left: screenWidth * 0.115 },
  labelMindLevel: { top: screenHeight * 0.45, left: screenWidth * 0.29 },
  labelSpirit: { top: screenHeight * 0.66, left: screenWidth * 0.115 },
  labelSpiritLevel: { top: screenHeight * 0.66, left: screenWidth * 0.29 },
  labelBody: { top: screenHeight * 0.45, left: screenWidth * 0.57 },
  labelBodyLevel: { top: screenHeight * 0.45, left: screenWidth * 0.745 },
  labelAccountability: { top: screenHeight * 0.66, left: screenWidth * 0.57 },
  labelAccountabilityLevel: { top: screenHeight * 0.66, left: screenWidth * 0.75 },

  // Sidebar and menu
  sideBar: {
    position: 'absolute',
    width: screenWidth * 0.11,
    height: screenHeight,
    backgroundColor: '#D9D9D9',
    left: 0,
    top: 0,
  },
  resetXp: {
    position: 'absolute',
    width: screenWidth * 0.085,
    height: screenHeight * 0.08,
    left: screenWidth * 0.0145,
    top: screenHeight * 0.40,
    borderRadius: 10,
    backgroundColor: '#204189'
  },
  sideButton: {
    position: 'absolute',
    width: screenWidth * 0.08,
    height: screenHeight * 0.095,
    left: screenWidth * 0.01,
    top: screenHeight * 0.155,
    backgroundColor: '#204189',
    borderRadius: 10,
    alignItems: "center",
  },
  sideLabelBox: {
    position: 'absolute',
    width: screenWidth * 0.04,
    height: screenHeight * 0.125,
    left: screenWidth * 0.11,
    top: screenHeight * 0.24,
    backgroundColor: '#204189',
    borderRadius: 10,

    // Flexbox for column layout
    flexDirection: 'column',
    alignItems: 'center',       // center horizontally
    justifyContent: 'center',   // center vertically
  },
  sideLabel: {
    color: '#fff',
    fontSize: screenWidth * 0.010,
  },
  hiddenSideButton: {
    position: 'absolute',
    width: screenWidth * 0.04,
    height: screenHeight * 0.125,
    left: 0,
    top: screenHeight * 0.25,
    backgroundColor: '#204189',
    borderRadius: 10,
  },
  hiddenMenuLine1: {
    position: 'absolute',
    width: screenWidth * 0.025,
    height: 5,
    left: screenWidth * 0.005,
    top: screenHeight * 0.28,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  hiddenMenuLine2: {
    position: 'absolute',
    width: screenWidth * 0.025,
    height: 5,
    left: screenWidth * 0.005,
    top: screenHeight * 0.308,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  hiddenMenuLine3: {
    position: 'absolute',
    width: screenWidth * 0.025,
    height: 5,
    left: screenWidth * 0.005,
    top: screenHeight * 0.335,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  menuLine1: {
    width: screenWidth * 0.025,
    height: 5,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  menuLine2: {
    width: screenWidth * 0.025,
    height: 5,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
  menuLine3: {
    width: screenWidth * 0.025,
    height: 5,
    backgroundColor: '#fff',
    transform: [{ rotate: '-45deg' }],
  },
});





