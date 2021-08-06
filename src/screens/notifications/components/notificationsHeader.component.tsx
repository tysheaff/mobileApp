import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventManager } from '@globals';
import { themeStyles } from '@styles';
import { EventType } from '@types';

export function NotificationsHeaderComponent() {
    return <TouchableOpacity
        style={[themeStyles.containerColorMain, styles.container]}
        onPress={() => eventManager.dispatchEvent(EventType.ToggleNotificationsFilter)}
    >
        <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
    </TouchableOpacity>;
}

const styles = StyleSheet.create(
    {
        container: {
            marginRight: 8,
            paddingHorizontal: 4,
        }
    }
);
