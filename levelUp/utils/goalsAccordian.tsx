import React, {useRef, useState} from "react";
import { Portal } from 'react-native-paper';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  LayoutAnimation,
  Image,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Goal = {
  id: string;
  title: string;
  description: string;
  time: string;
};

type GoalDropdownProps = {
  goal: Goal;
  activeGoal: string | null;
  setActiveGoal: React.Dispatch<React.SetStateAction<string | null>>;
  removeGoal: (id: String) => void;
  isGoal: Boolean
};

export default function GoalDropdown({ goal, activeGoal, setActiveGoal, removeGoal, isGoal }: GoalDropdownProps) {
  const cardRef = useRef<View>(null);
  const [cardY, setCardY] = useState(0);
  const [cardX, setCardX] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const isActive = activeGoal === goal.id;

  const toggle = () => {
    if (!isActive) {
      cardRef.current?.measureInWindow((x, y, width, height) => {
        setCardY(y);
        setCardX(x);
        setCardHeight(height);
        setCardWidth(width);
        setActiveGoal(goal.id);
      });
    } else {
      setActiveGoal(null);
    }
  };

return (
  <View ref={cardRef} style={styles.card}>
    <TouchableOpacity onPress={toggle} style={styles.header}>
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={styles.chevron}>{isActive ? "▲" : "▼"}</Text>
    </TouchableOpacity>

    {isActive && (
      <Portal>
        <TouchableWithoutFeedback onPress={() => setActiveGoal(null)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.overlay,
            { top: cardY + cardHeight + 8, left: screenWidth * 0.04 },
          ]}
        >
          {goal.time !== "" && <Text style={styles.overlayTime}>⏰ {goal.time}</Text>}
          {goal.description !== "" && <Text style={styles.overlayDesc}>Description: {goal.description}</Text>}
        </View> 
        <Portal>
          <TouchableOpacity onPress={() => {setActiveGoal(null), removeGoal(goal.id)}}>
            {isGoal ? <View><View style={[styles.checkButton, {left: screenWidth*0.72, top: screenHeight*0.765, 
              width: 80, height: 75, backgroundColor:'#EDEDED'}]}></View><Image source={require('../assets/images/CheckButton.png')} 
              style={styles.checkButton}/></View> : <Image source={require('../assets/images/DeleteButton.png')} style={styles.deleteButton}/>}
          </TouchableOpacity>
        </Portal>
      </Portal>
    )}
  </View>
);

}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: screenWidth * 0.03,   // ~12px relative
    marginVertical: screenHeight * 0.01, 
    padding: screenWidth * 0.03,
    elevation: 2,
    zIndex: 3,
    overflow: 'visible',
    borderWidth: 2,
    borderColor: 'rgb(0, 0, 0)',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: screenWidth * 0.035,  // ~18px relative
    fontWeight: "600",
  },
  chevron: {
    fontSize: screenWidth * 0.045,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 1,
  },
  overlay: {
    position: "absolute",
    width: screenWidth - screenWidth * 0.08, // ~width - 32
    maxHeight: screenHeight * 0.6, // flexible height with cap
    backgroundColor: "#fff",
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.04,
    zIndex: 1
  },
  overlayTime: {
    fontSize: screenWidth * 0.04,
    color: "#666",
    marginBottom: screenHeight * 0.012, 
    zIndex: 3,
  },
  overlayDesc: {
    fontSize: screenWidth * 0.038,
    lineHeight: screenHeight * 0.025,
    color: "#333",
    zIndex: 3,
  },
  overlayDelete: {
    position: 'absolute',
    backgroundColor: 'rgba(75, 75, 76, 1)',
    borderRadius: 10,
    left: screenWidth * 0.7,
    top: screenHeight * 0.7,
    width: screenWidth * 0.15,
    height: screenHeight * 0.05
  },
  deleteButton: {
    position: 'absolute',
    left: screenWidth*0.7,
    top: screenHeight*0.75,
    width: 100,
    height: 140
  },
  checkButton: {
    position: 'absolute',
    left: screenWidth*0.7,
    top: screenHeight*0.75,
    width: 100,
    height: 100
  }
});