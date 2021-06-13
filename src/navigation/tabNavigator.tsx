import React, { useEffect, useState } from 'react';
import { Image, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { eventManager, globals, navigatorGlobals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import { cache } from '@services/dataCaching';
import { EventType, NavigationEvent } from '@types';
import { notificationsService } from '@services/notificationsService';
import HomeStackScreen from './homeSatckNavigator';
import ProfileStackScreen from './profileStackNavigator';
import NotificationStackScreen from './notificationStackNavigator';
import WalletStackScreen from './walletStackNavigator';
import { getFocusedRouteNameFromRoute } from '@react-navigation/core';

const Tab = createBottomTabNavigator();

let firstScreen: any = {
    HomeStack: 'Home',
    ProfileStack: 'Profile',
    WalletStack: 'Wallet',
    CreatePostStack: 'CreatePost',
    NotificationStack: 'Notifications'
}

const TabElement = ({ tab, onPress, selectedTab, navigation }: any) => {
    const [profilePic, setProfilePic] = useState('https://i.imgur.com/vZ2mB1W.png');

    let iconColor = themeStyles.fontColorMain.color;
    let icon;
    let mount = true;

    if (selectedTab === tab.name) {
        iconColor = '#4287f5';
    }

    if (tab.name === 'HomeStack') {
        icon = <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'WalletStack') {
        icon = <Ionicons name="wallet-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'CreatePostStack') {
        icon = <Ionicons name="add-circle-sharp" size={50} color={themeStyles.fontColorMain.color} />
    } else if (tab.name === 'NotificationStack') {
        icon = <Ionicons name="md-notifications-outline" size={28} color={iconColor} />;
    } else if (tab.name === 'ProfileStack') {
        icon = <Image style={{ width: 30, height: 30, borderRadius: 30, borderWidth: selectedTab === tab.name ? 2 : 0, borderColor: iconColor }} source={{ uri: profilePic }}></Image>
    }

    useEffect(
        () => {
            if (tab.name === 'ProfileStack') {
                cache.user.getData().then(
                    (user) => {
                        if (mount && user.ProfileEntryResponse) {
                            setProfilePic(user.ProfileEntryResponse.ProfilePic);
                        }
                    }
                );
            }

            return () => {
                mount = false;
            };
        },
        []
    )

    return (
        <TouchableOpacity
            style={{ padding: 6 }}
            onPress={onPress}
            onLongPress={tab.name === 'ProfileStack' && !globals.readonly ? () => { eventManager.dispatchEvent(EventType.ToggleProfileManager, { visible: true, navigation: navigation }) } : undefined}
        >
            {icon}
        </TouchableOpacity>
    );
};

const TabBar = ({ state, navigation }: any) => {
    const [visible, setVisible] = useState(true);
    const [selectedTab, setSelectedTab] = useState('HomeStack');
    const { routes } = state;
    const { index } = state;
    const tabScreenNames = routes.map((route: any) => route.name);

    useEffect(() => {
        setSelectedTab(tabScreenNames[index])
    }, [index])

    useEffect(() => {
        let keyboardEventListeners: any;
        if (Platform.OS === 'android') {
            keyboardEventListeners = [
                Keyboard.addListener('keyboardDidShow', () => setVisible(false)),
                Keyboard.addListener('keyboardDidHide', () => setVisible(true)),
            ];
        }
        return () => {
            if (Platform.OS === 'android') {
                keyboardEventListeners &&
                    keyboardEventListeners.forEach((eventListener: any) => eventListener.remove());
            }
        };
    }, []);

    function navigate(p_screenName: string, p_params?: any) {
        let focusedRouteName = getFocusedRouteNameFromRoute(routes.find((route: any) => p_screenName === route.name));
        if (selectedTab === p_screenName) {
            if (selectedTab === 'HomeStack' && (focusedRouteName === 'Home' || focusedRouteName === undefined)) {
                navigatorGlobals.refreshHome();
            }
            navigation.navigate(selectedTab, { screen: firstScreen[selectedTab] });
        } else {
            navigation.navigate(p_screenName);
        }

        if (p_screenName === 'NotificationStack' && (focusedRouteName === 'Notifications' || focusedRouteName === undefined)) {
            navigatorGlobals.refreshNotifications();
        } else if (p_screenName === 'WalletStack' && (focusedRouteName === 'Wallet' || focusedRouteName === undefined)) {
            navigatorGlobals.refreshWallet();
        } else if (p_screenName === 'ProfileStack' && (focusedRouteName === 'Profile' || focusedRouteName === undefined)) {
            navigatorGlobals.refreshProfile();
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
}

export function TabNavigator({ navigation }: any) {

    useEffect(
        () => {
            const unsubscribe = eventManager.addEventListener(
                EventType.Navigation,
                (p_event: NavigationEvent) => {
                    let params;
                    let key;

                    switch (p_event.screen) {
                        case 'UserProfile':
                            params = {
                                publicKey: p_event.publicKey,
                                username: p_event.username
                            };
                            key = 'Profile_' + p_event.publicKey;
                            break;
                        case 'Post':
                            params = {
                                postHashHex: p_event.postHashHex,
                                priorityComment: p_event.priorityCommentHashHex
                            };
                            key = 'Post_' + p_event.postHashHex;
                            break;
                    }

                    if (params && key) {
                        const canGoBack = navigation.canGoBack();

                        if (canGoBack) {
                            navigation.popToTop();
                        }

                        navigation.navigate(
                            'TabNavigator',
                            {
                                screen: 'HomeStack',
                                params: {
                                    screen: p_event.screen,
                                    params: {
                                        ...params,
                                        key
                                    }
                                }
                            }
                        );
                    }
                }
            );

            notificationsService.registerNotificationHandler();
            return () => {
                unsubscribe();
                notificationsService.unregisterNotificationHandler();
            };
        },
        []
    );

    return (
        <Tab.Navigator
            tabBar={props => <TabBar {...props}></TabBar>}>
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
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingRight: 16,
            paddingLeft: 16,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            borderTopWidth: 1
        }
    }
);