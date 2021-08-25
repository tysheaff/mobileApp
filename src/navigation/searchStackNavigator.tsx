import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { ProfileScreen } from '@screens/profile/profile.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { PostScreen } from '@screens/post.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { globals } from '@globals/globals';
import { IdentityScreen } from '@screens/login/identity.screen';
import CloutTagPostsScreen from '@screens/cloutTagPosts/cloutTagPosts.screen';
import postStatsTabNavigator from '@screens/postStats/postStatsTabNavigator';
import { stackConfig } from './stackNavigationConfig';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { BadgesScreen } from '@screens/bitBadges/screens/bitBadges.screen';
import IssueBadgeScreen from '@screens/bitBadges/screens/issueBadge.screen';
import { BadgeScreen } from '@screens/bitBadges/screens/badge.screen';
import { PendingScreen } from '@screens/bitBadges/screens/pendingBadges.screen';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import ProfileFollowersTab from '@screens/profile/profileFollowersTabNavigator';
import { SearchHeaderComponent } from '@screens/search/components/searchHeader';
import SearchScreen from '@screens/search/search.screen';
import { DiscoveryTypeCreatorScreen } from '@screens/search/discoverTypeCreatorScreen';
import { DiscoveryType } from '@types';
import NFTTabNavigator from '@screens/nft/nftTabNavigator';
import BidEditionsScreen from '@screens/nft/bidEditions.screen';

const SearchStack = createStackNavigator();

function getDiscoveryTypeCreatorTitle(discoveryType: DiscoveryType) {
    switch (discoveryType) {
        case DiscoveryType.CommunityProject:
            return 'Community Projects';
        case DiscoveryType.ValueCreator:
            return 'Value Creators';
        case DiscoveryType.Goddess:
            return 'Goddesses';
    }
}

export default function SearchStackScreen() {
    return (
        <SearchStack.Navigator
            screenOptions={
                ({ navigation }: any) => (
                    {
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
                    }
                )
            }
        >
            <SearchStack.Screen
                options={
                    () => (
                        {
                            headerLeft: () => <></>,
                            headerBackTitle: '',
                            headerTitleAlign: 'center',
                            headerTitle: () => <SearchHeaderComponent />,
                        }
                    )
                }
                name="Search"
                component={SearchScreen}
            />

            <SearchStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: getDiscoveryTypeCreatorTitle((route.params as any)?.discoveryType),
                            headerBackTitle: ' '
                        }
                    )
                }
                name="DiscoveryTypeCreator"
                component={DiscoveryTypeCreatorScreen}
            />

            <SearchStack.Screen
                options={
                    {
                        headerTitle: 'CloutFeed',
                        headerBackTitle: ' '
                    }
                }
                name="UserProfile"
                component={ProfileScreen}
            />
            <SearchStack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            />
            <SearchStack.Screen
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
            <SearchStack.Screen
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
            <SearchStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            />

            <SearchStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="PostStatsTabNavigator"
                component={postStatsTabNavigator}
            />
            <SearchStack.Screen
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
            />
            <SearchStack.Screen
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
            <SearchStack.Screen
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
            <SearchStack.Screen
                options={{
                    headerStyle: {
                        backgroundColor: '#121212',
                        shadowRadius: 0,
                        shadowOffset: { height: 0, width: 0 },
                    },
                    headerTitleStyle: { color: 'white', fontSize: 20 },
                }}
                name="Identity"
                component={IdentityScreen}
            />
            <SearchStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'BitBadges',
                        headerBackTitle: ' ',
                    }
                )}
                name="BitBadges"
                component={BadgesScreen}
            />
            <SearchStack.Screen
                options={
                    {
                        headerTitle: 'Issue Badge',
                        headerBackTitle: ' '
                    }
                }
                name="Issue"
                component={IssueBadgeScreen}
            />
            <SearchStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Badge',
                        headerBackTitle: ' ',
                    }
                )}
                name="Badge"
                component={BadgeScreen}
            />
            <SearchStack.Screen
                options={({ route }) => (
                    {
                        title: route.params ? (route.params as any).username : 'Pending',
                        headerBackTitle: ' ',
                    }
                )}
                name="Pending"
                component={PendingScreen}
            />
            <SearchStack.Screen
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
            <SearchStack.Screen
                options={({ route }: any) => (
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
        </SearchStack.Navigator>
    );
}
const styles = StyleSheet.create(
    {
        postButton: {
            marginRight: 10,
        },
    }
);
