import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventManager } from '@globals';
import { themeStyles } from '@styles';
import { EventType } from '@types';

export function NotificationsHeaderComponent() {
    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>
        <TouchableOpacity
            style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
            onPress={() => eventManager.dispatchEvent(EventType.ToggleNotificationsFilter)}
        >
            <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create(
    {
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        }
    }
);
