import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { PostScreen } from '@screens/post.screen';
import { eventManager, globals } from '@globals';
import { themeStyles } from '@styles';
import { IdentityScreen } from '@screens/login/identity.screen';
import { HomeScreen } from '@screens/home/home.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { LogoHeaderComponent } from '@components/logoHeader.component';
import CloutTagPostsScreen from '@screens/cloutTagPosts/cloutTagPosts.screen';
import postStatsTabNavigator from '@screens/postStats/postStatsTabNavigator';
import { stackConfig } from './stackNavigationConfig';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { PendingScreen } from '@screens/bitBadges/screens/pendingBadges.screen';
import { BadgeScreen } from '@screens/bitBadges/screens/badge.screen';
import IssueBadgeScreen from '@screens/bitBadges/screens/issueBadge.screen';
import { BadgesScreen } from '@screens/bitBadges/screens/bitBadges.screen';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import ProfileFollowersTab from '@screens/profile/profileFollowersTabNavigator';
import { EventType } from '@types';
import { NotificationsScreen } from '@screens/notifications/notifications.screen';
import { NotificationsHeaderComponent } from '@screens/notifications/components/notificationsHeader.component';

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
                headerTitleStyle: { alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                headerStyle: {
                    backgroundColor: themeStyles.containerColorMain.backgroundColor,
                    shadowOpacity: 0,
                    elevation: 0
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
                                    style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                                    onPress={() => navigation.navigate('Notifications')}
                                >
                                    <>
                                        <Ionicons name="md-notifications-outline" size={28} color={themeStyles.fontColorMain.color} />
                                        {
                                            hasBadge && <View style={styles.notificationBadge} />
                                        }
                                    </>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                                    onPress={() => navigation.navigate('MessageStack')}
                                >
                                    <Feather name="send" size={26} color={themeStyles.fontColorMain.color} />
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
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="UserProfile"
                component={ProfileScreen}
            />

            <HomeStack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            />

            <HomeStack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? (route.params as any).username : 'Wallet',
                            headerBackTitle: ' '
                        }
                    )
                }
                name="UserWallet"
                component={WalletScreen}
            />

            <HomeStack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? (route.params as any).username : 'Profile',
                            headerBackTitle: ' '
                        }
                    )
                }
                name="ProfileFollowersTab"
                component={ProfileFollowersTab}
            />

            <HomeStack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? '$' + (route.params as any).username : 'Creator Coin',
                            headerTitleStyle: { fontSize: 20, alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                            headerBackTitle: ' '
                        }
                    )
                }
                name="CreatorCoin"
                component={CreatorCoinScreen}
            />

            <HomeStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitleStyle: { textAlign: 'center' },
                            headerTitle: (route.params as any).newPost ? 'New Post' : (route.params as any).comment ? 'New Comment' :
                                (route.params as any).editPost ? 'Edit Post' : 'Reclout Post',
                            headerBackTitle: 'Cancel',
                            headerRight: () => <CloutFeedButton
                                title={'Post'}
                                onPress={() => globals.createPost()}
                                styles={styles.postButton}
                            />
                        }
                    )}
                name="CreatePost"
                component={CreatePostScreen}
            />

            <HomeStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            />

            <HomeStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="PostStatsTabNavigator"
                component={postStatsTabNavigator}
            />

            <HomeStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: `#${(route.params as any).cloutTag}`,
                            headerBackTitle: ' ',
                        }
                    )}
                name="CloutTagPosts"
                component={CloutTagPostsScreen}
            />

            <HomeStack.Screen
                options={
                    {
                        headerStyle: styles.identityHeader,
                        headerTitleStyle: { color: 'white', fontSize: 20 }
                    }
                }
                name="Identity" component={IdentityScreen}
            />
            <HomeStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'BitBadges',
                        headerBackTitle: ' ',
                    }
                )}
                name="BitBadges"
                component={BadgesScreen}
            />
            <HomeStack.Screen
                options={
                    {
                        headerTitle: 'Issue Badge',
                        headerBackTitle: ' ',
                    }
                }
                name="Issue"
                component={IssueBadgeScreen}
            />
            <HomeStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Badge',
                        headerBackTitle: ' ',
                    })
                }
                name="Badge"
                component={BadgeScreen}
            />
            <HomeStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Pending',
                        headerBackTitle: ' ',
                    }
                )}
                name="Pending"
                component={PendingScreen}
            />
            <HomeStack.Screen
                options={
                    {
                        headerBackTitle: ' ',
                        headerTitleStyle: {
                            textAlign: 'center',
                        },
                        headerRight: () => <NotificationsHeaderComponent />
                    }
                }
                name="Notifications"
                component={NotificationsScreen}
            />
        </HomeStack.Navigator>
    );
}

const styles = StyleSheet.create(
    {
        postButton: {
            marginRight: 10,
        },
        identityHeader: {
            backgroundColor: '#121212',
            shadowRadius: 0,
            shadowOffset: { height: 0, width: 0 }
        },
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
            left: 24,
            top: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9
        }
    }
);
