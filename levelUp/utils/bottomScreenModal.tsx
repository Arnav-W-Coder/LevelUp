import React, { useRef, useMemo, useState, useEffect, forwardRef } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, TextInput, Alert, Animated, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
export type Ref = BottomSheetModal;

const CustomBottomSheetModal = forwardRef<Ref>((props, ref) => {
    // Snap points define how tall the sheet opens
    const snapPoints = useMemo(() => ['25%', '50%'], []);

    return (
        <BottomSheetModal ref={ref} index={0} snapPoints={snapPoints}>
            <View style={{ flex: 1, padding: 16, backgroundColor: '#ffffffff' }}>
                <Text style={{ color: 'black', fontSize: 16, marginBottom: 12 }}>🗑 Delete Goal</Text>
                <Text style={{ color: 'black', fontSize: 16, marginBottom: 12 }}>📄 View Details</Text>
            </View>
        </BottomSheetModal>
    );
});

export default CustomBottomSheetModal;