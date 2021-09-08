import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { eventManager } from '@globals';
import { themeStyles } from '@styles';
import { HomeScreen } from '@screens/home/home.screen';
import { LogoHeaderComponent } from '@components/logoHeader.component';
import { stackConfig } from './stackNavigationConfig';
import { EventType } from '@types';
import { SharedStackScreens } from './sharedStackScreens';
import { NotificationsHeaderComponent } from '@screens/notifications/components/notificationsHeader.component';
import { NotificationsScreen } from '@screens/notifications/notifications.screen';

const HomeStack = createStackNavigator();

export default function HomeStackScreen(): JSX.Element {

    const [messagesCount, setMessagesCount] = useState<number>(0);
    const [hasBadge, setHasBadge] = useState<boolean>(false);

    const isMounted = useRef<boolean>(true);

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

            const unsubscribeRefreshMessages = eventManager.addEventListener(
                EventType.RefreshMessages,
                (count: number) => {
                    if (isMounted) {
                        setMessagesCount(count);
                    }
                }
            );
            return () => {
                isMounted.current = false;
                unsubscribeRefreshMessages();
                unsubscribeLastNotificationIndex();
            };
        },
        []
    );

    return (
        <HomeStack.Navigator
            screenOptions={({ navigation }: any) => ({
                ...stackConfig,
                headerTitleStyle: {
                    alignSelf: 'center',
                    marginRight: Platform.OS === 'ios' ? 0 : 50,
                    color: themeStyles.fontColorMain.color
                },
                headerStyle: {
                    backgroundColor: themeStyles.containerColorMain.backgroundColor,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                    <Ionicons name="chevron-back" size={32} color="#007ef5" />
                </TouchableOpacity>
            })}>
            <HomeStack.Screen
                options={
                    ({ navigation }) => ({
                        headerTitle: ' ',
                        headerBackTitle: ' ',
                        headerLeft: () => <LogoHeaderComponent></LogoHeaderComponent>,
                        headerRight: () => (
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity
                                    style={styles.headerIcon}
                                    onPress={() => navigation.navigate('Notifications')}
                                >
                                    <>
                                        <Ionicons name="md-notifications-outline" size={27} color={themeStyles.fontColorMain.color} />
                                        {
                                            hasBadge && <View style={styles.notificationBadge} />
                                        }
                                    </>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerIcon}
                                    onPress={() => navigation.navigate('MessageStack')}
                                >
                                    <Feather name="send" size={25} color={themeStyles.fontColorMain.color} />
                                    {
                                        messagesCount > 0 &&
                                        <View style={styles.messagesBadge}>
                                            <Text style={styles.messagesCount}>
                                                {
                                                    messagesCount > 9 ?
                                                        9 + '+'
                                                        : messagesCount
                                                }
                                            </Text>
                                        </View>
                                    }
                                </TouchableOpacity>
                            </View>
                        ),
                    })
                }
                name="Home"
                component={HomeScreen}
            />

            <HomeStack.Screen
                options={
                    {
                        headerTitleStyle: {
                            alignSelf: 'center',
                            color: themeStyles.fontColorMain.color
                        },
                        headerBackTitle: ' ',
                        headerRight: () => <NotificationsHeaderComponent />
                    }
                }
                name="Notifications"
                component={NotificationsScreen}
            />

            {
                SharedStackScreens.map((item: any, index: number) => <HomeStack.Screen
                    key={`${item.name as string}_${index}`}
                    options={item.options}
                    name={item.name}
                    component={item.component}
                />
                )
            }

        </HomeStack.Navigator>
    );
}

const styles = StyleSheet.create(
    {
        messagesBadge: {
            width: 14,
            height: 14,
            borderRadius: 10,
            position: 'absolute',
            right: 2,
            top: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#eb1b0c'
        },
        messagesCount: {
            fontSize: 10,
            color: 'white',
            fontWeight: '600',
            marginLeft: 1
        },
        notificationBadge: {
            width: 6,
            height: 6,
            backgroundColor: '#eb1b0c',
            position: 'absolute',
            left: 22,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9
        },
        headerIcon: {
            marginRight: 8,
            paddingHorizontal: 4
        }
    }
);
