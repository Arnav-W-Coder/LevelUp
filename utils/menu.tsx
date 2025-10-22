import React, { useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
    goToHome: () => void;
    goToGoal: () => void;
    goToDungeon: () => void;
    goToCharacter: () => void;
    goToCalendar: () => void;
    screen: String
};

export default function menu({ goToHome, goToGoal, goToDungeon, goToCharacter, goToCalendar, screen }: Props) {
    const[isSelected, setSelected] = useState(["Home", "Character", "Goal", "Dungeon", "Calendar"]);
    return (
        <View style={styles.menu}>
            <Pressable onPress={goToHome} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed, screen === isSelected[0] && styles.selected ]}>
                <Image source={require('../assets/images/levelUp home icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToCharacter} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed, screen === isSelected[1] && styles.selected ]}>
                <Image source={require('../assets/images/levelUp character icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToGoal} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed, screen === isSelected[2] && styles.selected ]}>
                <Image source={require('../assets/images/levelUp goal icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToDungeon} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed, screen === isSelected[3] && styles.selected ]}>
                <Image source={require('../assets/images/levelUp dungeon icon.png')} style={styles.image} resizeMode='cover'/>
            </Pressable>
            <Pressable onPress={goToCalendar} style={({pressed}) => [styles.menuButton, pressed && styles.buttonPressed, screen === isSelected[4] && styles.selected ]}>
                <Image source={require('../assets/images/levelUp calendar icon.png')} style={styles.calendar} resizeMode='cover'/>
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
        paddingBottom: screenHeight * 0.01,
        paddingHorizontal: screenWidth * 0.05,
        paddingVertical: screenHeight * 0.005           
    },
    image: {
        width: '100%',
        height: '100%',
    },
    calendar:{
        width: '200%',
        height: '100%',
        alignSelf: 'center'
    },
    menuButton: {
        width: screenWidth * 0.12,
        height: screenWidth * 0.12,
        borderRadius: 6
    },
    menuText: {
        fontSize: screenHeight * 0.05,
        color: 'rgb(0, 0, 0)'
    },
    buttonPressed: {
        transform: [{ scale: 0.9 }],
    },
    selected: {
        borderWidth: 1,
        borderColor: "rgba(108, 172, 255, 1)", // light blue
        elevation: 3
    },
});