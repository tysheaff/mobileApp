import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Image, StyleSheet, Text, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AppearanceScreen } from '@screens/appearance.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import { SettingsScreen } from '@screens/settings/settings.screen';
import { globals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { PostScreen } from '@screens/post.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { IdentityScreen } from '@screens/login/identity.screen';
import { FeedSettingsScreen } from '@screens/feedSettings.screen';
import BlockedUsersScreen from '@screens/settings/blockedUsers.screen';
import CloutTagPostsScreen from '@screens/cloutTagPosts/cloutTagPosts.screen';
import { SavedPostsScreen } from '@screens/savedPosts/savedPosts.screen';
import postStatsTabNavigator from '@screens/postStats/postStatsTabNavigator';
import { stackConfig } from './stackNavigationConfig';
import HapticsScreen from '@screens/settings/haptics.screen';
import NotificationsSettingsScreen from '@screens/settings/notificationsSettings.screen';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { PendingScreen } from '@screens/bitBadges/screens/pendingBadges.screen';
import { BadgeScreen } from '@screens/bitBadges/screens/badge.screen';
import IssueBadgeScreen from '@screens/bitBadges/screens/issueBadge.screen';
import { BadgesScreen } from '@screens/bitBadges/screens/bitBadges.screen';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import ProfileFollowersTab from '@screens/profile/profileFollowersTabNavigator';
import BidEditionsScreen from '@screens/nft/bidEditions.screen';
import NFTTabNavigator from '@screens/nft/nftTabNavigator';

const ProfileStack = createStackNavigator();

export default function ProfileStackScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    return <ProfileStack.Navigator
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
        <ProfileStack.Screen
            options={
                () => ({
                    headerTitle: ' ',
                    headerLeft: () =>
                        <View style={styles.headerContainer}>
                            {
                                settingsGlobals.darkMode ?
                                    <Image
                                        style={styles.logo}
                                        source={require('../../assets/icon-black.png')}
                                    />
                                    :
                                    <Image
                                        style={styles.logo}
                                        source={require('../../assets/icon-white.png')}
                                    />
                            }
                            <Text style={{
                                marginLeft: -10,
                                fontWeight: '700',
                                fontSize: 20,
                                color: themeStyles.fontColorMain.color
                            }}>CloutFeed</Text>
                        </View>
                    ,
                    headerRight: () => (
                        <View style={styles.headerContainer}>
                            {
                                <TouchableOpacity
                                    style={styles.settingsIcon}
                                    onPress={() => navigation.navigate('Settings')}
                                >
                                    <Feather name="settings" size={24} color={themeStyles.fontColorMain.color} />
                                </TouchableOpacity>
                            }
                        </View>
                    ),
                })
            }
            name="Profile"
            component={ProfileScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'CloutFeed',
                headerBackTitle: ' '
            }}
            name="UserProfile"
            component={ProfileScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Edit Profile',
                headerBackTitle: ' '
            }}
            name="EditProfile"
            component={EditProfileScreen}
        />
        <ProfileStack.Screen
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
        <ProfileStack.Screen
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
        <ProfileStack.Screen
            options={{
                headerTitle: 'Settings',
                headerBackTitle: ' ',
            }}
            name="Settings"
            component={SettingsScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Blocked Users',
                headerBackTitle: ' ',
            }}
            name="BlockedUsers"
            component={BlockedUsersScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Appearance',
                headerBackTitle: ' ',
            }}
            name="Appearance"
            component={AppearanceScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Haptics',
                headerBackTitle: ' ',
            }}
            name="HapticsSettings"
            component={HapticsScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Notifications',
                headerBackTitle: ' ',
            }}
            name="NotificationsSettings"
            component={NotificationsSettingsScreen}
        />
        <ProfileStack.Screen
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
        <ProfileStack.Screen
            options={{
                headerTitle: 'Feed Settings',
                headerBackTitle: ' ',
            }}
            name="FeedSettings"
            component={FeedSettingsScreen}
        />

        <ProfileStack.Screen
            options={{
                headerTitle: 'Saved Posts',
                headerBackTitle: ' ',
            }}
            name="SavedPosts"
            component={SavedPostsScreen}
        />
        <ProfileStack.Screen
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
        <ProfileStack.Screen
            options={{
                headerTitle: 'CloutFeed',
                headerBackTitle: ' '
            }}
            name="Post"
            component={PostScreen}
        ></ProfileStack.Screen>

        <ProfileStack.Screen
            options={{
                headerTitle: 'CloutFeed',
                headerBackTitle: ' '
            }}
            name="PostStatsTabNavigator"
            component={postStatsTabNavigator}
        ></ProfileStack.Screen>

        <ProfileStack.Screen
            options={
                ({ route }) => (
                    {
                        headerTitleStyle: {
                            alignSelf: 'center',
                            color: themeStyles.fontColorMain.color
                        },
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
        ></ProfileStack.Screen>

        <ProfileStack.Screen
            options={
                {
                    headerStyle: { backgroundColor: '#121212', shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                    headerTitleStyle: { color: 'white', fontSize: 20 }
                }
            }
            name="Identity" component={IdentityScreen}
        ></ProfileStack.Screen>

        <ProfileStack.Screen
            options={({ route }) => (
                {
                    title: route.params ? (route.params as any).username : 'BitBadges',
                    headerBackTitle: ' ',
                }
            )}
            name="BitBadges"
            component={BadgesScreen}
        />

        <ProfileStack.Screen
            options={
                {
                    headerTitle: 'Issue Badge',
                    headerBackTitle: ' '
                }
            }
            name="Issue"
            component={IssueBadgeScreen}
        />

        <ProfileStack.Screen
            options={({ route }) => (
                {
                    title: route.params ? (route.params as any).username : 'Badge',
                    headerBackTitle: ' ',
                }
            )}
            name="Badge"
            component={BadgeScreen}
        />

        <ProfileStack.Screen
            options={({ route }) => (
                {
                    title: route.params ? (route.params as any).username : 'Pending',
                    headerBackTitle: ' ',
                }
            )}
            name="Pending"
            component={PendingScreen}
        />
        <ProfileStack.Screen
            options={({ route }: any) => (
                {
                    headerTitleStyle: {
                        alignSelf: 'center',
                        color: themeStyles.fontColorMain.color
                    },
                    headerTitle: route.params?.username ? route.params?.username : 'NFT',
                    headerBackTitle: ' ',
                    headerRight: () => <></>
                }
            )}
            name="NFTTabNavigator"
            component={NFTTabNavigator}
        />
        <ProfileStack.Screen
            options={({ navigation }: any) => (
                {
                    headerTitleStyle: {
                        alignSelf: 'center',
                        color: themeStyles.fontColorMain.color
                    },
                    headerTitle: 'Bid Editions',
                    headerBackTitle: ' ',
                    headerRight: () => <></>
                }
            )}
            name="BidEditions"
            component={BidEditionsScreen}
        />
    </ProfileStack.Navigator>;
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        postButton: {
            marginRight: 10,
        },
        logo: {
            width: 50,
            height: 40
        },
        settingsIcon: {
            marginRight: 8,
            paddingHorizontal: 4
        },
    }
);
