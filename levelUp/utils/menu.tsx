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
            <TouchableOpacity onPress={goToHome} style={styles.menuButton}>
                <Text style={styles.menuText}>🏠</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToCharacter} style={styles.menuButton}>
                <Text style={styles.menuText}>🧍</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToGoal} style={styles.menuButton}>
                <Text style={styles.menuText}>🎯</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToDungeon} style={styles.menuButton}>
                <Text style={styles.menuText}>🧱</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    menu: {
        position: 'absolute',
        width: screenWidth,
        height: screenHeight * 0.08,
        backgroundColor: 'rgb(11, 22, 41)',
        //marginTop: screenHeight * 0.8,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    image: {
        width: screenHeight * 0.1,
        height: screenHeight * 0.05,
    },
    menuButton: {
        width: screenHeight * 0.1,
        height: screenHeight * 0.1,
    },
    menuText: {
        fontSize: screenHeight * 0.05,
        color: 'rgb(0, 0, 0)'
    }
});