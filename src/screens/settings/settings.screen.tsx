import React, { useEffect } from 'react';
import { Text, View, StyleSheet, FlatList, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { themeStyles } from '@styles';
import { globals } from '@globals';
import { Entypo, Ionicons, Feather, SimpleLineIcons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

interface Settings {
    title: string;
    icon: any;
    action: () => void;
}

export function SettingsScreen({ navigation }: any) {

    const settings: Settings[] = [
        {
            title: 'Notifications',
            icon: <Ionicons name="md-notifications-outline" size={28} color={themeStyles.fontColorMain.color} />,
            action: () => navigation.navigate('NotificationsSettings')
        },
        {
            title: 'Haptics',
            icon: <MaterialCommunityIcons name="vibrate" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => navigation.navigate('HapticsSettings')
        },
        {
            title: 'Feed',
            icon: <MaterialCommunityIcons name="lightning-bolt-outline" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => navigation.navigate('FeedSettings')
        },
        {
            title: 'Saved Posts',
            icon: <Feather name="bookmark" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => navigation.navigate('SavedPosts')
        },
        {
            title: 'Blocked Users',
            icon: <Entypo name="block" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => navigation.navigate('BlockedUsers')
        },
        {
            title: 'Privacy Policy',
            icon: <Feather name="lock" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => Linking.openURL('https://clouttechnologies.com/privacy-policy')
        },
        {
            title: 'Terms & Conditions',
            icon: <MaterialCommunityIcons name="text-box-check-outline" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => Linking.openURL('https://clouttechnologies.com/terms-%26-conditions')
        },
        {
            title: 'Contact Us',
            icon: <Ionicons name="mail-unread-outline" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => Linking.openURL('https://clouttechnologies.com/home')
        },
        {
            title: 'Logout',
            icon: <SimpleLineIcons name="logout" size={24} color={themeStyles.fontColorMain.color} />,
            action: () => globals.onLogout()
        },
        {
            title: 'CloutFeed v 1.4.4',
            icon: <AntDesign name="copyright" style={{ marginLeft: 6 }} size={24} color={themeStyles.fontColorMain.color} />,
            action: () => { }
        },
    ];

    const appearance: Settings = {
        title: 'Appearance',
        icon: <Ionicons name="ios-color-palette" size={24} color={themeStyles.fontColorMain.color} />,
        action: () => navigation.navigate('Appearance'),

    }

    globals.followerFeatures && settings.unshift(appearance);

    const keyExtractor = (item: Settings, index: number) => `${item.title}_${index.toString()}`;

    const renderItem = (p_item: Settings) => {
        return <TouchableOpacity
            style={[styles.buttonContainer, themeStyles.containerColorMain, themeStyles.borderColor]}
            onPress={p_item.action}
            activeOpacity={1}>
            {p_item.icon}
            <Text style={[styles.buttonText, themeStyles.fontColorMain]}>{p_item.title}</Text>
        </TouchableOpacity>
    };

    return (
        <View style={[styles.container, themeStyles.containerColorSub]}>
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
