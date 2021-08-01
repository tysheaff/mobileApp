import { NavigationProp } from '@react-navigation/core';
import { ActionSheetConfig } from '@services/actionSheet';
import { Post } from './models';

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
    RefreshMessages = 10
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
