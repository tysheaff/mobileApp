import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ChatScreen } from '@screens/chatScreen';
import { PostScreen } from '@screens/post.screen';
import { MessageTopHoldersOptionsScreen } from '@screens/messageTopHolders/messageTopHoldersOptions';
import { MessageTopHoldersInputScreen } from '@screens/messageTopHolders/messageTopHoldersInput';
import { ChatHeaderComponent } from '@components/chatHeader.component';
import { MessagesHeaderComponent } from '@screens/messages/components/messagesHeader';
import { navigatorGlobals, globals } from '@globals';
import { themeStyles } from '@styles';
import { MessagesScreen } from '@screens/messages/messages.screen';
import { IdentityScreen } from '@screens/login/identity.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
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

const MessageStack = createStackNavigator();

export default function MessageStackScreen() {
    return (
        <MessageStack.Navigator
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
            })}
        >
            <MessageStack.Screen
                options={{
                    headerRight: () => <MessagesHeaderComponent />,
                }}
                name="Messages"
                component={MessagesScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'Broadcast',
                    headerBackTitle: ' ',
                }}
                name="MessageTopHoldersOptions"
                component={MessageTopHoldersOptionsScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'Broadcast',
                    headerBackTitle: ' ',
                    headerRight: () => <CloutFeedButton
                        title={'Send'}
                        onPress={navigatorGlobals.broadcastMessage}
                        styles={styles.postButton}
                    />
                }}
                name="MessageTopHoldersInput"
                component={MessageTopHoldersInputScreen}
            />

            <MessageStack.Screen
                options={({ route }) => (
                    {
                        title: ' ',
                        headerBackTitle: ' ',
                        headerLeft: () => (
                            route.params &&
                            <ChatHeaderComponent contactWithMessages={(route.params as any).contactWithMessages} />
                        )
                    }
                )}
                name="Chat"
                component={ChatScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="UserProfile"
                component={ProfileScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            />

            <MessageStack.Screen
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

            <MessageStack.Screen
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

            <MessageStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: (route.params as any).newPost ? 'New Post' : (route.params as any).comment ? 'New Comment' :
                                (route.params as any).editPost ? 'Edit Post' : 'Reclout Post',
                            headerBackTitle: 'Cancel',
                            headerRight: () => <CloutFeedButton
                                title={'Post'}
                                onPress={globals.createPost}
                                styles={styles.postButton} />
                        }
                    )}
                name="CreatePost"
                component={CreatePostScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            />

            <MessageStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="PostStatsTabNavigator"
                component={postStatsTabNavigator}
            />

            <MessageStack.Screen
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

            <MessageStack.Screen
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

            <MessageStack.Screen
                options={
                    {
                        headerStyle: styles.identity,
                        headerTitleStyle: { color: 'white', fontSize: 20 }
                    }
                }
                name="Identity" component={IdentityScreen}
            />

            <MessageStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'BitBadges',
                        headerBackTitle: ' ',
                    }
                )}
                name="BitBadges"
                component={BadgesScreen}
            />

            <MessageStack.Screen
                options={
                    {
                        headerTitle: 'Issue Badge',
                        headerBackTitle: ' '
                    }
                }
                name="Issue"
                component={IssueBadgeScreen}
            />

            <MessageStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Badge',
                        headerBackTitle: ' ',
                    }
                )}
                name="Badge"
                component={BadgeScreen}
            />

            <MessageStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Pending',
                        headerBackTitle: ' ',
                    }
                )}
                name="Pending"
                component={PendingScreen}
            />
        </MessageStack.Navigator>
    );
}

const styles = StyleSheet.create(
    {
        postButton: {
            marginRight: 10,
        },
        identity: {
            backgroundColor: '#121212',
            shadowRadius: 0,
            shadowOffset: { height: 0, width: 0 }
        }
    }
);
