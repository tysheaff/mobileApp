import React from 'react';
import { Text, View, StyleSheet, FlatList, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SimpleLineIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { globals } from '@globals';

interface Settings {
    title: string;
    icon: any;
}

export function SettingsScreen({ navigation }: any) {

    const settings: Settings[] = [
        {
            title: 'Feed',
            icon: <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={themeStyles.fontColorMain.color} />
        },
        {
            title: 'Privacy Policy',
            icon: <Feather name="lock" size={24} color={themeStyles.fontColorMain.color} />
        },
        {
            title: 'Terms & Conditions',
            icon: <MaterialCommunityIcons name="text-box-check-outline" size={24} color={themeStyles.fontColorMain.color} />
        },
        {
            title: 'Contact Us',
            icon: <Ionicons name="mail-unread-outline" size={24} color={themeStyles.fontColorMain.color} />
        },
        {
            title: 'Logout',
            icon: <SimpleLineIcons name="logout" size={24} color={themeStyles.fontColorMain.color} />
        },
        {
            title: 'CloutFeed v 1.4.1',
            icon: <AntDesign name="copyright" style={{ marginLeft: 6 }} size={18} color={themeStyles.fontColorMain.color} />
        },
    ];

    const onSettingsClick = (p_option: string) => {
        switch (p_option) {
            case 'Feed':
                return navigation.navigate('FeedSettings')
            case 'Privacy Policy':
                return Linking.openURL('https://clouttechnologies.com/privacy-policy');
            case 'Terms & Conditions':
                return Linking.openURL('https://clouttechnologies.com/terms-%26-conditions');
            case 'Contact Us':
                return Linking.openURL('https://clouttechnologies.com/home');
            case 'Logout':
                return globals.onLogout();
        }
    };

    const keyExtractor = (item: any, index: number) => item.toString() + index.toString();

    const renderItem = (p_item: Settings) => {
        return <TouchableOpacity
            style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
            onPress={() => onSettingsClick(p_item.title)}
            activeOpacity={1}>
            {p_item.icon}
            <Text style={[styles.buttonText, themeStyles.fontColorMain]}>{p_item.title}</Text>
        </TouchableOpacity>
    };

    return (
        <View style={[styles.container, themeStyles.containerColorSub]}>
            {
                globals.followerFeatures &&
                <TouchableOpacity
                    style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
                    onPress={() => navigation.navigate('Appearance')}
                    activeOpacity={1}>
                    <Ionicons name="ios-color-palette" size={24} color={themeStyles.fontColorMain.color} />
                    <Text style={[styles.buttonText, themeStyles.fontColorMain]}>Appearance</Text>
                </TouchableOpacity>
            }
            <FlatList
                data={settings}
                renderItem={({ item }) => renderItem(item)}
                keyExtractor={keyExtractor}
            />
        </View>
    );
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        buttonContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1
        },
        buttonText: {
            marginLeft: 12,
            fontWeight: '600'
        }
    }
);