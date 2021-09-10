import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { globals } from '@globals/globals';
import { BadgeScreen } from '@screens/bitBadges/screens/badge.screen';
import { BadgesScreen } from '@screens/bitBadges/screens/bitBadges.screen';
import IssueBadgeScreen from '@screens/bitBadges/screens/issueBadge.screen';
import { PendingScreen } from '@screens/bitBadges/screens/pendingBadges.screen';
import CloutTagPostsScreen from '@screens/cloutTagPosts/cloutTagPosts.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { IdentityScreen } from '@screens/login/identity.screen';
import AuctionsTabNavigator from '@screens/nft/auctionsTabNavigator';
import BidEditionsScreen from '@screens/nft/bidEditions.screen';
import MintPostScreen from '@screens/nft/mintPost.screen';
import NFTTabNavigator from '@screens/nft/nftTabNavigator';
import SellNftScreen from '@screens/nft/sellNft.screen';
import { PostScreen } from '@screens/post.screen';
import postStatsTabNavigator from '@screens/postStats/postStatsTabNavigator';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import ProfileFollowersTab from '@screens/profile/profileFollowersTabNavigator';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import { themeStyles } from '@styles/globalColors';

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
    }
);

export const SharedStackScreens = [
    {
        options: {
            headerTitle: 'CloutFeed',
            headerBackTitle: ' '
        },
        name: 'UserProfile',
        component: ProfileScreen
    },
    {
        options: {
            headerTitle: 'Edit Profile',
            headerBackTitle: ' '
        },
        name: 'EditProfile',
        component: EditProfileScreen
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: route.params ? route.params.username : 'Wallet',
                headerBackTitle: ' '
            }
        )
        ,
        name: 'UserWallet',
        component: WalletScreen
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: route.params ? route.params.username : 'Profile',
                headerBackTitle: ' '
            }
        ),
        name: 'ProfileFollowersTab',
        component: ProfileFollowersTab
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: route.params ? '$' + route.params.username : 'Creator Coin',
                headerTitleStyle: { fontSize: 20, alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                headerBackTitle: ' '
            }
        ),
        name: 'CreatorCoin',
        component: CreatorCoinScreen
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: route.params.newPost ? 'New Post' : route.params.comment ? 'New Comment' :
                    route.params.editPost ? 'Edit Post' : 'Reclout Post',
                headerBackTitle: 'Cancel',
                headerRight: () => <CloutFeedButton
                    title={'Post'}
                    onPress={() => globals.createPost()}
                    styles={styles.postButton}
                />
            }
        ),
        name: 'CreatePost',
        component: CreatePostScreen
    },
    {
        options: {
            headerTitle: 'CloutFeed',
            headerBackTitle: ' '
        },
        name: 'Post',
        component: PostScreen
    },
    {
        options: {
            headerTitle: 'CloutFeed',
            headerBackTitle: ' '
        },
        name: 'PostStatsTabNavigator',
        component: postStatsTabNavigator
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: `#${route.params.cloutTag as string}`,
                headerBackTitle: ' ',
            }
        ),
        name: 'CloutTagPosts',
        component: CloutTagPostsScreen
    },
    {
        options: ({ route }: any) => (
            {
                headerTitle: route.params ? route.params.username : 'BitBadges',
                headerBackTitle: ' ',
            }
        ),
        name: 'BitBadges',
        component: BadgesScreen
    },
    {
        options: {
            headerStyle: styles.identityHeader,
            headerTitleStyle: { color: 'white', fontSize: 20 }
        },
        name: 'Identity',
        component: IdentityScreen
    },
    {
        options:
        {
            headerTitle: 'Issue Badge',
            headerBackTitle: ' ',
        },
        name: 'Issue',
        component: IssueBadgeScreen
    },
    {
        options:
            ({ route }: any) => (
                {
                    headerTitle: route.params ? route.params.username : 'Badge',
                    headerBackTitle: ' ',
                }),
        name: 'Badge',
        component: BadgeScreen
    },
    {
        options:
            ({ route }: any) => (
                {
                    headerTitle: route.params ? route.params.username : 'Pending',
                    headerBackTitle: ' ',
                }
            ),
        name: 'Pending',
        component: PendingScreen
    },
    {
        options:
            ({ route }: any) => (
                {
                    headerTitle: route.params?.username ? route.params?.username : 'NFT',
                    headerBackTitle: ' ',
                    headerRight: () => <></>
                }
            ),
        name: 'NFTTabNavigator',
        component: NFTTabNavigator
    },
    {
        options:
        {
            headerTitle: 'Bid Editions',
            headerBackTitle: ' ',
            headerRight: () => <></>
        },
        name: 'BidEditions',
        component: BidEditionsScreen
    },
    {
        options:
        {
            headerTitle: 'Edit Auctions',
            headerBackTitle: ' ',
            headerRight: () => <></>
        },
        name: 'AuctionTabNavigator',
        component: AuctionsTabNavigator
    },
    {
        options:
        {
            headerTitle: 'Mint NFT',
            headerBackTitle: ' ',
            headerRight: () => <></>
        },
        name: 'MintPost',
        component: MintPostScreen
    },
    {
        options:
        {
            headerTitle: 'Sell NFT',
            headerBackTitle: ' ',
            headerRight: () => <></>
        },
        name: 'SellNft',
        component: SellNftScreen
    },
];
