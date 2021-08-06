import React from 'react';
import { Dimensions, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { navigatorGlobals, settingsGlobals } from '@globals';

export function SearchHeaderComponent() {

    return <View style={[styles.textInputContainer, themeStyles.containerColorSub, themeStyles.borderColor]}>
        <Ionicons style={[styles.searchIcon, themeStyles.fontColorSub]} name="ios-search" size={20} color={themeStyles.fontColorMain.color} />
        <TextInput
            style={[styles.textInput, themeStyles.fontColorMain]}
            onChangeText={(p_text) => navigatorGlobals.searchResults(p_text)}
            blurOnSubmit={true}
            maxLength={50}
            placeholder={'Search'}
            placeholderTextColor={themeStyles.fontColorSub.color}
            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
        />
    </View>;
}
const styles = StyleSheet.create(
    {
        textInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: Dimensions.get('window').width - 20,
            borderRadius: 8,
            paddingHorizontal: 10,
            marginVertical: 6,
            height: 35
        },
        searchIcon: {
            marginRight: 10
        },
        textInput: {
            flex: 1,
            fontSize: 16
        }
    }
);
