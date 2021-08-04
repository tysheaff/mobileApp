import React, { useEffect, useState, useRef } from 'react';
import { EmitterSubscription, Image, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { eventManager, globals, hapticsManager, navigatorGlobals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import { cache } from '@services/dataCaching';
import { EventType } from '@types';
import HomeStackScreen from './homeSatckNavigator';
import ProfileStackScreen from './profileStackNavigator';
import NotificationStackScreen from './notificationStackNavigator';
import WalletStackScreen from './walletStackNavigator';
import { getFocusedRouteNameFromRoute } from '@react-navigation/core';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();

const firstScreen: any = {
    HomeStack: 'Home',
    ProfileStack: 'Profile',
    WalletStack: 'Wallet',
    CreatePostStack: 'CreatePost',
    NotificationStack: 'Notifications'
};

const TabElement = ({ tab, onPress, selectedTab }: any) => {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [profilePic, setProfilePic] = useState('https://i.imgur.com/vZ2mB1W.png');
    const [hasBadge, setHasBadge] = useState(false);

    let iconColor = themeStyles.fontColorMain.color;
    let icon;
    const isMounted = useRef<boolean>(true);

    if (selectedTab === tab.name) {
        iconColor = '#4287f5';
    }

    if (tab.name === 'HomeStack') {
        icon = <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'WalletStack') {
        icon = <Ionicons name="wallet-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'CreatePostStack') {
        icon = <Ionicons name="add-circle-sharp" size={50} color={themeStyles.fontColorMain.color} />;
    } else if (tab.name === 'NotificationStack') {
        icon = <>
            <Ionicons name="md-notifications-outline" size={28} color={iconColor} />
            {
                hasBadge && <View style={styles.notificationBadge} />
            }
        </>;
    } else if (tab.name === 'ProfileStack') {
        icon = <Image
            style={[
                styles.profileImage,
                { borderWidth: selectedTab === tab.name ? 2 : 0, borderColor: iconColor }
            ]}
            source={{ uri: profilePic }} />;
    }

    useEffect(
        () => {
            const unsubscribeLastNotificationIndex = eventManager.addEventListener(
                EventType.RefreshNotifications,
                (newLastSeenIndex: number) => {
                    if (isMounted) {
                        if (newLastSeenIndex > 0) {
                            setHasBadge(true);
                        } else {
                            setHasBadge(false);
                        }
                    }
                }
            );

            if (tab.name === 'ProfileStack') {
                cache.user.getData().then(
                    (user) => {
                        if (isMounted && user.ProfileEntryResponse) {
                            setProfilePic(user.ProfileEntryResponse.ProfilePic + '?' + new Date().toISOString());
                        }
                    }
                );
            }

            return () => {
                isMounted.current = false;
                unsubscribeLastNotificationIndex();
            };
        },
        []
    );

    function openProfileManager() {
        if (tab.name === 'ProfileStack' && !globals.readonly) {
            eventManager.dispatchEvent(EventType.ToggleProfileManager, { visible: true, navigation: navigation });
            hapticsManager.customizedImpact();
        }
    }

    return (
        <TouchableOpacity
            style={{ padding: 6 }}
            onPress={onPress}
            onLongPress={openProfileManager}
        >
            {icon}
        </TouchableOpacity>
    );
};

const TabBar = ({ state }: any) => {

    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [visible, setVisible] = useState(true);
    const [selectedTab, setSelectedTab] = useState('HomeStack');
    const { routes } = state;
    const { index } = state;
    const tabScreenNames = routes.map((route: any) => route.name);

    useEffect(() => {
        setSelectedTab(tabScreenNames[index]);
    }, [index]);

    useEffect(() => {
        let keyboardEventListeners: EmitterSubscription[];
        if (Platform.OS === 'android') {
            keyboardEventListeners = [
                Keyboard.addListener('keyboardDidShow', () => setVisible(false)),
                Keyboard.addListener('keyboardDidHide', () => setVisible(true)),
            ];
        }
        return () => {
            if (Platform.OS === 'android') {
                keyboardEventListeners &&
                    keyboardEventListeners.forEach((eventListener: EmitterSubscription) => eventListener.remove());
            }
        };
    }, []);

    function navigate(p_screenName: string) {
        const focusedRouteName = getFocusedRouteNameFromRoute(routes.find((route: any) => p_screenName === route.name));
        if (selectedTab === p_screenName) {
            if (selectedTab === 'HomeStack' && (focusedRouteName === 'Home' || focusedRouteName === undefined)) {
                navigatorGlobals.refreshHome();
            } else if (p_screenName === 'NotificationStack' && (focusedRouteName === 'Notifications' || focusedRouteName === undefined)) {
                navigatorGlobals.refreshNotifications();
            } else if (p_screenName === 'WalletStack' && (focusedRouteName === 'Wallet' || focusedRouteName === undefined)) {
                navigatorGlobals.refreshWallet();
            } else if (p_screenName === 'ProfileStack' && (focusedRouteName === 'Profile' || focusedRouteName === undefined)) {
                navigatorGlobals.refreshProfile();
            }
            navigation.navigate(selectedTab, { screen: firstScreen[selectedTab] });
        } else {
            navigation.navigate(p_screenName);
        }
    }

    if (Platform.OS === 'android' && !visible) {
        return null;
    }
    return (
        <View style={[styles.tabsContainer, themeStyles.containerColorMain, { borderColor: settingsGlobals.darkMode ? '#141414' : '#f2f2f2' }]}>
            {
                routes.slice(0, 2).map((p_route: any) => (
                    <TabElement
                        tab={p_route}
                        onPress={() => navigate(p_route.name)}
                        selectedTab={selectedTab}
                        key={p_route.key}>
                    </TabElement>
                ))
            }
            <View>
                <TouchableOpacity onPress={() => navigation.push('TabNavigator', {
                    screen: 'HomeStack',
                    params: {
                        screen: 'CreatePost',
                        params: {
                            newPost: true,
                            key: 'NewPost'
                        }
                    }
                })}>
                    <Ionicons name="add-circle-sharp" size={50} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
            </View>
            {
                routes.slice(2).map((p_route: any) => (
                    <TabElement
                        tab={p_route}
                        onPress={() => navigate(p_route.name)}
                        selectedTab={selectedTab}
                        key={p_route.key}
                        navigation={navigation}>
                    </TabElement>
                ))
            }
        </View>
    );
};

export function TabNavigator() {
    return (
        <Tab.Navigator
            sceneContainerStyle={themeStyles.containerColorMain}
            tabBar={props => <TabBar {...props} />}>
            <Tab.Screen name="HomeStack" component={HomeStackScreen} />
            <Tab.Screen name="WalletStack" component={WalletStackScreen} />
            <Tab.Screen name="NotificationStack" component={NotificationStackScreen} />
            <Tab.Screen name="ProfileStack" component={ProfileStackScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create(
    {
        tabsContainer: {
            height: Platform.OS === 'ios' ? 80 : 60,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            borderTopWidth: 1
        },
        profileImage: {
            width: 30,
            height: 30,
            borderRadius: 30
        },
        notificationBadge: {
            width: 12,
            height: 12,
            backgroundColor: '#eb1b0c',
            position: 'absolute',
            top: 5,
            right: 7,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9
        }
    }
);
