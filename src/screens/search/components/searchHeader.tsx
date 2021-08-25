import React, { useRef } from 'react';
import { Dimensions, StyleSheet, TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { eventManager, navigatorGlobals, settingsGlobals } from '@globals';
import { EventType, FocusSearchHeaderEvent } from '@types';

export function SearchHeaderComponent() {
    const textInput = useRef<TextInput>(null);

    function changeInputState(focused: boolean) {
        const event: FocusSearchHeaderEvent = {
            focused
        };

        eventManager.dispatchEvent(EventType.FocusSearchHeader, event);

        if (!focused) {
            textInput?.current?.blur();
        }
    }

    return <View style={styles.container}>
        <View style={[styles.textInputContainer, themeStyles.containerColorSub, themeStyles.borderColor]}>
            <Ionicons style={[styles.searchIcon, themeStyles.fontColorSub]} name="ios-search" size={20} color={themeStyles.fontColorMain.color} />
            <TextInput
                ref={textInput}
                style={[styles.textInput, themeStyles.fontColorMain]}
                onChangeText={(p_text) => navigatorGlobals.searchResults(p_text)}
                blurOnSubmit={true}
                maxLength={50}
                placeholder={'Search'}
                placeholderTextColor={themeStyles.fontColorSub.color}
                keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                onFocus={() => changeInputState(true)}
            />
        </View>
        <Text
            style={[styles.cancelText, themeStyles.fontColorMain]}
            onPress={() => changeInputState(false)}>Cancel</Text>
    </View>;
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            marginVertical: 6,
            alignItems: 'center',
            width: Dimensions.get('window').width - 10,
        },
        textInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 8,
            paddingHorizontal: 10,
            height: 35,
            flex: 1
        },
        searchIcon: {
            marginRight: 10
        },
        textInput: {
            flex: 1,
            fontSize: 16
        },
        cancelText: {
            marginLeft: 6,
            fontSize: 16
        }
    }
);
