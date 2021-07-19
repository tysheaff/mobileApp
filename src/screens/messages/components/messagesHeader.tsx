import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { eventManager, globals } from '@globals';
import { themeStyles } from '@styles';
import { EventType } from '@types';
import { StackNavigationProp } from '@react-navigation/stack';

export function MessagesHeaderComponent(): JSX.Element {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>
        <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => eventManager.dispatchEvent(EventType.OpenMessagesSettings)}
        >
            <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
        </TouchableOpacity>
        {
            globals.investorFeatures ?
                <TouchableOpacity
                    style={styles.headerIcon}
                    onPress={() => navigation.navigate('MessageTopHoldersOptions')}
                >
                    <FontAwesome name="send-o" size={24} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
                : undefined
        }
    </View>;
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerIcon: {
            marginRight: 8,
            paddingHorizontal: 4
        }
    }
);
