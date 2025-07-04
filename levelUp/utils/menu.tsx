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
    const [menuVisible, setMenuVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-screenWidth*0.5)).current;

    const toggleMenu = () => {
        Animated.timing(slideAnim, {
            toValue: menuVisible ? -screenWidth*0.5 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setMenuVisible(!menuVisible);
    };

    return (
        <View style={styles.sideBar}>
            {/* Menu Button */}
            <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                <Image source={require('../assets/images/MenuButton.png')} />
            </TouchableOpacity>

            {/* Sliding Menu */}
            <Animated.View style={[styles.sideBar, { left: slideAnim }]}>
                <TouchableOpacity onPress={goToHome}>
                    <Image source={require('../assets/images/HomescreenButton.png')} style={styles.image} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToCharacter}>
                    <Image source={require('../assets/images/CharacterscreenButton.png')} style={styles.image} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToGoal}>
                    <Image source={require('../assets/images/GoalscreenButton.png')} style={styles.image} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToDungeon}>
                    <Image source={require('../assets/images/DungeonscreenButton.png')} style={styles.image} />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    sideBar: {
        position: 'absolute',
        width: screenWidth * 0.5,
        height: screenHeight,
        backgroundColor: 'rgb(17, 35, 66)',
        left: 0,
        top: 0,
        borderWidth: screenWidth * 0.001,
        borderColor: 'rgb(0, 0, 0)',
        alignItems: 'center',
        marginBottom: screenHeight * 0.05
    },
    image: {
        position: 'absolute',
        width: screenWidth * 0.25,
        height: screenHeight * 0.125,
    },
    menuButton: {
        position: 'absolute',
        top: 0,
        left: screenWidth * 0.9,
        width: screenWidth * 0.01,
        height: screenWidth * 0.01
    }
});