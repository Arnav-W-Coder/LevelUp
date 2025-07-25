import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Button, Image, Dimensions, Animated } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
    goToHome: () => void;
    goToGoal: () => void;
    goToDungeon: () => void;
    goToCharacter: () => void;
};

export default function menu({ goToHome, goToGoal, goToDungeon, goToCharacter }: Props) {

    return (
        <View style={styles.menu}>
            <Pressable onPress={goToHome} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed ]}>
                <Image source={require('../assets/images/levelUp home icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToCharacter} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed ]}>
                <Image source={require('../assets/images/levelUp character icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToGoal} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed ]}>
                <Image source={require('../assets/images/levelUp goal icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToDungeon} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed ]}>
                <Image source={require('../assets/images/levelUp dungeon icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    menu: {
        position: 'absolute',
        width: screenWidth,
        height: screenHeight * 0.08,
        backgroundColor: 'rgb(13, 17, 23)',
        borderTopColor: 'rgb(255, 255, 255)',
        borderTopWidth: screenHeight * 0.001,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    image: {
        width: screenWidth * 0.05,
        height: '100%',
    },
    menuButton: {
        width: screenWidth * 0.05,
        height: '100%',
    },
    menuText: {
        fontSize: screenHeight * 0.05,
        color: 'rgb(0, 0, 0)'
    },
    buttonPressed: {
        transform: [{ scale: 0.9 }],
    },
});