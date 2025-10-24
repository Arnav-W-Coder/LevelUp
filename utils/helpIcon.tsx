import { Ionicons } from '@expo/vector-icons'; // if using Expo, otherwise install react-native-vector-icons
import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, Text, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HelpIcon() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Help Icon */}
      <Pressable
        onPress={() => setVisible(true)}
        style={{
          position: 'absolute',
          top: screenHeight*0.85 ,
          left: 20,
          zIndex: 20,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 20,
          padding: 8,
        }}
      >
        <Ionicons name="help-circle-outline" size={28} color="white" />
      </Pressable>

      {/* Instruction Modal */}
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              width: '90%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#111' }}>
              How to Use LevelUp
            </Text>

            <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
              • Tap the "+" icon to create new goals in each category (Mind, Body, Spirit, Accountability).
            </Text>
            <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
              • Choose whether to plan for <Text style={{ fontWeight: '600' }}>Today</Text> or <Text style={{ fontWeight: '600' }}>Tomorrow</Text>.
            </Text>
            <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
              • Complete goals to earn XP and level up your character.
            </Text>
            <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
              • Advance through the dungeon by achieving the required level in each category.
            </Text>
            <Text style={{ color: '#333', fontSize: 16, marginBottom: 8 }}>
              • Track progress on the <Text style={{ fontWeight: '600' }}>Calendar</Text> tab — dots mark your planned and completed days.
            </Text>
            <Text style={{ color: '#333', fontSize: 16 }}>
              • Use reflections or streaks to stay consistent and motivated!
            </Text>

            <Pressable
              onPress={() => setVisible(false)}
              style={{
                backgroundColor: '#2563EB',
                marginTop: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Got it!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
