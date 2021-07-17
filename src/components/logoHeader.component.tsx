import { settingsGlobals } from '@globals/settingsGlobals';
import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';

export function LogoHeaderComponent(): JSX.Element {
    return <View style={styles.headerContainer}>
        {
            settingsGlobals.darkMode ?
                <Image
                    style={styles.logo}
                    source={require('../../assets/icon-black.png')}
                ></Image>
                :
                <Image
                    style={styles.logo}
                    source={require('../../assets/icon-white.png')}
                ></Image>
        }
        <Text style={{ marginLeft: -10, fontWeight: '700', fontSize: 20, color: themeStyles.fontColorMain.color }}>CloutFeed</Text>
    </View>;
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        logo: {
            width: 50,
            height: 40
        }
    }
);
