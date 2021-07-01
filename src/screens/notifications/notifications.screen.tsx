import React from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { constants, eventManager, globals, navigatorGlobals } from '@globals';
import { EventType, Notification, NotificationType, Post, Profile } from '@types';
import { api, getAnonymousProfile, loadTickersAndExchangeRate } from '@services';
import { themeStyles } from '@styles';
import { FollowNotificationComponent } from './components/followNotification.component';
import { BasicTransferNotificationComponent } from './components/basicTransferNotification.component';
import { LikeNotificationComponent } from './components/likeNotification.component';
import { CreatorCoinNotificationComponent } from './components/creatorCoinNotification.component';
import { CreatorCoinTransferNotificationComponent } from './components/creatorCoinTransferNotification.component';
import { PostReplyNotificationComponent } from './components/postReplyNotification.component';
import { PostMentionNotificationComponent } from './components/postMentionNotification.component';
import { PostRecloutNotificationComponent } from './components/postRecloutNotification.component';
import { NavigationProp } from '@react-navigation/native';
import { NotificationsFilter, NotificationsFilterComponent } from './components/notificationsFilter.component';
import { filterNotifications } from './notificaitonFilterHelper';
import * as SecureStore from 'expo-secure-store';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

interface Props {
    standardPublicKey: string;
    nonStandardPublicKey?: string;
    back: () => void;
    selectAccount: (publicKey: string) => void;
    navigation: NavigationProp<any>;
}

interface State {
    isLoading: boolean;
    notifications: Notification[];
    filteredNotifications: Notification[];
    profiles: { [key: string]: Profile };
    posts: { [key: string]: Post };
    refreshing: boolean;
    isLoadingMore: boolean;
    lastNotificationIndex: number;
    init: boolean;
    filter: NotificationsFilter | undefined;
    showFilter: boolean;
    filterSet: boolean;
    noMoreNotifications: boolean;
}

export class NotificationsScreen extends React.Component<Props, State> {

    private _lastLoadMoreId: number = -1;
    private _isMounted = true;

    private _subscriptions: (() => void)[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            notifications: [],
            filteredNotifications: [],
            profiles: {},
            posts: {},
            refreshing: false,
            isLoadingMore: false,
            lastNotificationIndex: -999,
            init: false,
            filter: undefined,
            showFilter: false,
            filterSet: false,
            noMoreNotifications: false
        };

        this._subscriptions.push(
            eventManager.addEventListener(EventType.ToggleNotificationsFilter, this.toggleNotificationsFilter.bind(this))
        );

        this.loadNotifications = this.loadNotifications.bind(this);
        this.loadMoreNotifications = this.loadMoreNotifications.bind(this);
        this.goToProfile = this.goToProfile.bind(this);
        this.goToPost = this.goToPost.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.renderSubmitPostNotification = this.renderSubmitPostNotification.bind(this);
        this.renderPostMentionNotification = this.renderPostMentionNotification.bind(this);
        this.renderNotification = this.renderNotification.bind(this);
        this.onFilterChanged = this.onFilterChanged.bind(this);
    }

    componentDidMount() {
        this.setState({ init: true });
        this.initScreen();
    }

    componentWillUnmount() {
        for (const unsubscribe of this._subscriptions) {
            unsubscribe();
        }

        this._isMounted = false;
    }

    async initScreen() {
        const showFilter = await SecureStore.getItemAsync(constants.localStorage_showNotificationsFilter).catch(() => 'false');
        const filterString = await SecureStore.getItemAsync(constants.localStorage_notificationsFilter).catch(() => undefined);

        let filter;
        if (filterString) {
            try {
                filter = JSON.parse(filterString);
            } catch { }
        }

        this.setState({ showFilter: showFilter === 'true', filter });
        this.loadNotifications(true);
    }

    loadNotifications(p_force = false) {
        if (!this.state.init && !p_force) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: true, isLoadingMore: false, noMoreNotifications: false, notifications: [], filteredNotifications: [] });
        }

        this._lastLoadMoreId = Math.floor(Math.random() * 1000);

        const filterSet = this.state.filter != null && this.getFilterSet(this.state.filter);

        api.getNotifications(globals.user.publicKey, -1, 50)
            .then(
                p_response => {
                    loadTickersAndExchangeRate().then(
                        () => {
                            if (this._isMounted) {
                                this.setState({
                                    notifications: p_response.Notifications ? p_response.Notifications : [],
                                    profiles: p_response.ProfilesByPublicKey,
                                    isLoading: false,
                                    refreshing: false,
                                    posts: p_response.PostsByHash
                                });
                            }

                            if (filterSet) {
                                this.onFilterChanged(this.state.filter as NotificationsFilter);
                            }
                        }
                    );
                }
            ).catch(p_error => globals.defaultHandleError(p_error));
    }

    toggleNotificationsFilter() {
        const newState = !this.state.showFilter;
        this.setState({ showFilter: newState });
        SecureStore.setItemAsync(constants.localStorage_showNotificationsFilter, String(newState)).catch(() => { });
    }

    loadMoreNotifications() {
        if (this.state.isLoadingMore) {
            return;
        }

        if (this.state.notifications?.length > 0 && !this.state.noMoreNotifications) {
            const newLastNotificationIndex = this.state.notifications[this.state.notifications.length - 1].Index;

            if (newLastNotificationIndex !== 0) {
                if (this.state.filterSet) {
                    this.loadMoreFilteredNotifications(this.state.filter as NotificationsFilter, newLastNotificationIndex, 50);
                } else {

                    if (this._isMounted) {
                        this.setState({ isLoadingMore: true });
                    }

                    api.getNotifications(globals.user.publicKey, newLastNotificationIndex - 1, 50).then(
                        p_response => {
                            if (this._isMounted) {
                                const allNotifications = this.state.notifications.concat(p_response.Notifications);
                                this.setState((p_previousValue) => ({
                                    notifications: allNotifications,
                                    lastNotificationIndex: newLastNotificationIndex,
                                    isLoading: false,
                                    refreshing: false,
                                    profiles: Object.assign(p_previousValue.profiles, p_response.ProfilesByPublicKey),
                                    posts: Object.assign(p_previousValue.posts, p_response.PostsByHash),
                                    noMoreNotifications: p_response.Notifications?.length === 0
                                }));
                            }
                        }
                    ).catch(p_error => globals.defaultHandleError(p_error)).finally(
                        () => {
                            if (this._isMounted) {
                                this.setState({ isLoadingMore: false });
                            }
                        }
                    );
                }
            }
        }
    }

    goToProfile(p_userKey: string, p_username: string) {
        if (p_username !== 'anonymous') {
            try {
                this.props.navigation.navigate('UserProfile', {
                    publicKey: p_userKey,
                    username: p_username
                });
            } catch {
                alert('Something went wrong! Please try again.')
            }
        }
    }

    goToPost(p_postHashHex: string, p_priorityComment?: string) {
        try {
            this.props.navigation.navigate('Post', {
                postHashHex: p_postHashHex,
                priorityComment: p_priorityComment
            });
        } catch {
            alert('Something went wrong! Please try again.')
        }
    }

    getProfile(p_notification: Notification): Profile {
        let profile = this.state.profiles[p_notification.Metadata.TransactorPublicKeyBase58Check];
        if (!profile) {
            profile = getAnonymousProfile(p_notification.Metadata.TransactorPublicKeyBase58Check);
        } else {
            profile.ProfilePic = api.getSingleProfileImage(p_notification.Metadata.TransactorPublicKeyBase58Check);
        }

        return profile;
    }

    renderSubmitPostNotification(p_notification: Notification) {
        const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
        const profile = this.getProfile(p_notification);

        const post = this.state.posts[postHashHex];
        if (!post) {
            return undefined;
        }

        if (post.RecloutedPostEntryResponse) {
            if (post.RecloutedPostEntryResponse.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey) {
                return <PostRecloutNotificationComponent
                    post={post}
                    notification={p_notification}
                    goToPost={this.goToPost}
                    styles={styles}
                    goToProfile={this.goToProfile}
                    profile={profile}
                    postHashHex={postHashHex}
                />;
            } else {
                return this.renderPostMentionNotification(p_notification, false);
            }
        } else {
            const parentPostHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex;

            if (parentPostHashHex) {
                const parentPost = this.state.posts[parentPostHashHex];

                if (parentPost && parentPost.ProfileEntryResponse.PublicKeyBase58Check === globals.user.publicKey) {
                    return <PostReplyNotificationComponent
                        notification={p_notification}
                        profile={profile}
                        post={post}
                        goToProfile={this.goToProfile}
                        goToPost={this.goToPost}
                        styles={styles}
                        postHashHex={postHashHex}
                    />
                } else {
                    return this.renderPostMentionNotification(p_notification, true);
                }
            } else {
                return this.renderPostMentionNotification(p_notification, false);
            }
        }
    }

    renderPostMentionNotification(p_notification: Notification, p_withParentPost: boolean) {
        const profile = this.getProfile(p_notification);
        let parentPoshHashHex: string;
        let postHashHex: string;
        let post: Post;
        postHashHex = ''

        if (p_withParentPost) {
            parentPoshHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex as string;
            postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
            post = this.state.posts[postHashHex];
        } else {
            parentPoshHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
            post = this.state.posts[parentPoshHashHex];
        }

        return (
            <PostMentionNotificationComponent
                profile={profile}
                post={post}
                goToProfile={this.goToProfile}
                goToPost={this.goToPost}
                notification={p_notification}
                postHashHex={postHashHex}
                parentPoshHashHex={parentPoshHashHex}
                styles={styles}
            />
        );
    }

    renderNotification(p_notification: Notification): any {
        if (p_notification?.Metadata) {

            const profile = this.getProfile(p_notification)
            switch (p_notification.Metadata.TxnType) {
                case NotificationType.Follow:
                    return <FollowNotificationComponent
                        styles={styles}
                        profile={profile}
                        goToProfile={this.goToProfile}
                        notification={p_notification} />
                case NotificationType.BasicTransfer:
                    return <BasicTransferNotificationComponent
                        styles={styles}
                        notification={p_notification}
                        goToProfile={this.goToProfile} profile={profile}
                    />
                case NotificationType.Like: {
                    const postHashHex = p_notification.Metadata.LikeTxindexMetadata?.PostHashHex as string;
                    return <LikeNotificationComponent
                        styles={styles}
                        post={this.state.posts[postHashHex]}
                        notification={p_notification}
                        goToPost={this.goToPost}
                        goToProfile={this.goToProfile}
                        profile={profile}
                    />
                }
                case NotificationType.CreatorCoin:
                    return <CreatorCoinNotificationComponent
                        styles={styles}
                        notification={p_notification}
                        goToProfile={this.goToProfile}
                        profile={profile} />

                case NotificationType.CreatorCoinTransfer:
                    const postHashHex = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.PostHashHex as string;
                    return <CreatorCoinTransferNotificationComponent
                        profile={profile}
                        notification={p_notification}
                        goToProfile={this.goToProfile}
                        goToPost={this.goToPost}
                        styles={styles}
                        post={this.state.posts[postHashHex]}
                    />
                case NotificationType.SubmitPost:
                    return this.renderSubmitPostNotification(p_notification);
                default:
                    return undefined;
            }
        }
        return undefined;
    }

    async onFilterChanged(p_filter: NotificationsFilter) {
        SecureStore.setItemAsync(constants.localStorage_notificationsFilter, JSON.stringify(p_filter)).catch(() => { });
        const filteredNotifications = filterNotifications(this.state.notifications, p_filter, this.state.posts);
        const filterSet = this.getFilterSet(p_filter);
        const missingNotificationsCount = 50 - filteredNotifications.length;
        const lastIndex: number = this.state.notifications.length === 0 ? 0 : this.state.notifications[this.state.notifications.length - 1].Index;

        this._lastLoadMoreId = Math.floor(Math.random() * 1000);
        this.setState(
            {
                filteredNotifications: filteredNotifications,
                lastNotificationIndex: lastIndex,
                filter: p_filter,
                filterSet: filterSet,
                isLoadingMore: false
            }
        );

        if (missingNotificationsCount > 0) {
            await this.loadMoreFilteredNotifications(p_filter, lastIndex, missingNotificationsCount);
        }
    }

    getFilterSet(p_filter: NotificationsFilter) {
        const filterSet = p_filter != null && Object.keys(p_filter).some(p_filterKey => (p_filter as any)[p_filterKey]);
        return filterSet;
    }

    async loadMoreFilteredNotifications(p_filter: NotificationsFilter, p_lastIndex: number, p_count: number) {
        let loadedCount = 0;

        if (this._isMounted) {
            this.setState({ isLoadingMore: true });
        } else {
            return;
        }
        this._lastLoadMoreId = Math.floor(Math.random() * 1000);
        const loadingId = this._lastLoadMoreId;

        let noMoreNotifications = false;

        while (loadedCount < p_count && p_lastIndex !== 0 && !noMoreNotifications) {
            const response = await api.getNotifications(globals.user.publicKey, p_lastIndex - 1, 100);
            if (loadingId !== this._lastLoadMoreId) {
                break;
            }

            noMoreNotifications = response.Notifications?.length === 0;

            const newFilteredNotifications = filterNotifications(response.Notifications, p_filter, response.PostsByHash);
            loadedCount += newFilteredNotifications.length;

            p_lastIndex = response.Notifications.length === 0 ? 0 : response.Notifications[response.Notifications.length - 1].Index;

            this.setState(p_previousValue => (
                {
                    notifications: this.state.notifications.concat(response.Notifications),
                    filteredNotifications: this.state.filteredNotifications.concat(newFilteredNotifications),
                    lastNotificationIndex: response.Notifications,
                    profiles: Object.assign(p_previousValue.profiles, response.ProfilesByPublicKey),
                    posts: Object.assign(p_previousValue.posts, response.PostsByHash)
                }
            ));
        }

        if (this._isMounted && loadingId === this._lastLoadMoreId) {
            this.setState({ isLoadingMore: false, isLoading: false, noMoreNotifications });
        }
    }

    render() {
        navigatorGlobals.refreshNotifications = this.loadNotifications;

        const keyExtractor = (item: any, index: number) => item.Index?.toString() + index.toString();
        return this.state.isLoading ?
            <CloutFeedLoader />
            :
            globals.readonly ?
                <View style={[{ alignItems: 'center', justifyContent: 'center' }, styles.listContainer, themeStyles.containerColorSub]}>
                    <Text style={[themeStyles.fontColorMain]}>Notifications are not available in the read-only mode.</Text>
                </View>
                :
                <View style={[styles.listContainer, themeStyles.containerColorMain]}>
                    {
                        this.state.showFilter ?
                            <NotificationsFilterComponent
                                filter={this.state.filter}
                                onFilterChange={this.onFilterChanged}></NotificationsFilterComponent>
                            :
                            undefined
                    }
                    <FlatList
                        data={this.state.filterSet ? this.state.filteredNotifications : this.state.notifications}
                        keyExtractor={keyExtractor}
                        renderItem={({ item }) => this.renderNotification(item)}
                        onEndReached={this.loadMoreNotifications}
                        onEndReachedThreshold={4}
                        maxToRenderPerBatch={20}
                        windowSize={20}
                        refreshControl={<RefreshControl
                            tintColor={themeStyles.fontColorMain.color}
                            titleColor={themeStyles.fontColorMain.color}
                            refreshing={this.state.refreshing}
                            onRefresh={this.loadNotifications} />}
                        ListFooterComponent={() => this.state.isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : <View></View>}

                    />
                </View>
    }
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        listContainer: {
            flex: 1,
            width: Dimensions.get('window').width
        },
        notificationContainer: {
            height: 65,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: Dimensions.get('window').width
        },
        centerTextVertically: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        textContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: Dimensions.get('window').width - 74
        },
        profilePic: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        usernameText: {
            fontWeight: '700'
        },
        iconContainer: {
            position: 'absolute',
            left: 35,
            bottom: 4,
            borderRadius: 20,
            width: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        },
        postText: {
            marginTop: 4,
            fontWeight: '500'
        }
    }
);