import { NavigationProp } from '@react-navigation/core';
import { ActionSheetConfig } from '@services/actionSheet';
import { BidEdition, Post, Profile } from './models';

export enum EventType {
    IncreaseFollowers = 0,
    DecreaseFollowers = 1,
    OpenMessagesSettings = 2,
    ToggleProfileManager = 3,
    Navigation = 4,
    ToggleNotificationsFilter = 5,
    ToggleActionSheet = 6,
    UnsavePost = 7,
    ToggleCloutCastFeed = 8,
    RemovePendingBadges = 9,
    ToggleProfileInfoModal = 10,
    RefreshNotifications = 11,
    RefreshMessages = 12,
    FocusSearchHeader = 13,
    ToggleBidForm = 14,
    ToggleSetSelectedNfts = 15,
    BroadcastMessage = 16
}

export interface ChangeFollowersEvent {
    publicKey: string;
}

export interface ToggleActionSheetEvent {
    visible: boolean;
    config: ActionSheetConfig,
}

export interface ToggleProfileManagerEvent {
    visible: boolean;
    navigation: NavigationProp<any>;
}

export interface ToggleCloutCastFeedEvent {
    active: boolean;
}

export interface FocusSearchHeaderEvent {
    focused: boolean;
}

export interface NavigationEvent {
    loggedInUsername: string;
    screen: 'Post' | 'UserProfile';
    publicKey?: string;
    username?: string;
    postHashHex?: string;
    priorityCommentHashHex?: string;
}

export interface UnsavePostEvent {
    post: Post;
}

export interface RemovePendingBadges {
    badgesToRemove: string[];
}

export interface ToggleBidFormEvent {
    visible: boolean;
    post: Post;
    bidEdition: BidEdition
}

export interface ToggleProfileInfoModalEvent {
    visible: boolean;
    profile: Profile;
    coinPrice: number;
    navigation: NavigationProp<any>;
}

export interface ToggleSellNftModalEvent {
    selectedNftsForSale: Post[]
}
