import React from 'react';
import { View } from 'react-native';
import { api, notificationsService } from '@services';
import { themeStyles } from '@styles';
import { constants, eventManager, globals } from '@globals';
import { EventType, NavigationEvent, Post, ToggleCloutCastFeedEvent } from '@types';
import { TabConfig, TabsComponent } from '@components/tabs.component';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { PostListComponent } from './components/postList.component';
import * as SecureStore from 'expo-secure-store'
import { CloutCastFeedComponent } from './components/cloutCastFeed.component';

enum HomeScreenTab {
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent',
    Cast = 'Cast'
};

type RouteParams = {
    Home: {
        newPost: Post;
        deletedPost: Post;
        blockedUser: any;
    }
};

interface Props {
    navigation: NavigationProp<any> | any;
    route: RouteProp<RouteParams, 'Home'>;
};

interface State {
    selectedTab: HomeScreenTab;
    tabs: TabConfig[];
    api: any;
};

export class HomeScreen extends React.Component<Props, State> {

    private _postListComponent = React.createRef<PostListComponent>();
    private _cloutCastFeedComponent = React.createRef<CloutCastFeedComponent>();
    private _unsubscribeNavigationEvent: any;
    private _unsubscribeCloutCastEvent: any;

    constructor(props: Props) {

        super(props);
        this.state = {
            selectedTab: HomeScreenTab.Global,
            tabs: [],
            api: api.getGlobalPosts,
        };

        this.init();
        notificationsService.registerNotificationHandler();
        this.subscribeNavigationEvent();
        this.subscribeToggleCloutCastEvent();

        this.onTabClick = this.onTabClick.bind(this);
    };

    componentWillUnmount() {
        notificationsService.unregisterNotificationHandler();
        this._unsubscribeNavigationEvent();
        this._unsubscribeCloutCastEvent();
    };

    async init() {
        const key = globals.user.publicKey + constants.localStorage_defaultFeed;
        const defaultFeed = await SecureStore.getItemAsync(key).catch(() => undefined);

        const selectedTab = defaultFeed ? defaultFeed as HomeScreenTab : HomeScreenTab.Global;
        this.setState({ selectedTab });
        this.configureTabs();
    }

    async configureTabs() {
        const newTabs: TabConfig[] = [
            {
                name: HomeScreenTab.Global
            },
            {
                name: HomeScreenTab.Following
            },
            {
                name: HomeScreenTab.Recent
            }
        ];

        if (!globals.readonly) {
            const key = globals.user.publicKey + constants.localStorage_cloutCastFeedEnabled;
            const cloutCastFeedEnabled = await SecureStore.getItemAsync(key).catch(() => undefined);
            const addCloutCastFeed = cloutCastFeedEnabled === 'true';

            if (addCloutCastFeed) {
                newTabs.push(
                    {
                        name: HomeScreenTab.Cast
                    }
                );
            }
        }

        this.setState({ tabs: newTabs });
    }

    subscribeNavigationEvent() {
        this._unsubscribeNavigationEvent = eventManager.addEventListener(
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
                    this.props.navigation.navigate('HomeStack', { screen: 'Home' });
                    this.props.navigation.push(
                        p_event.screen,
                        params
                    );
                }
            }
        );
    }

    subscribeToggleCloutCastEvent() {
        this._unsubscribeCloutCastEvent = eventManager.addEventListener(
            EventType.ToggleCloutCastFeed,
            () => {
                this.init();
            }
        );
    }

    onTabClick(p_tabName: string) {
        let apiCallback: any;
        if (p_tabName === HomeScreenTab.Global) {
            apiCallback = api.getGlobalPosts
        } else if (p_tabName === HomeScreenTab.Following) {
            apiCallback = api.getFollowingPosts
        } else {
            apiCallback = api.getRecentPosts
        }
        this.setState({ api: apiCallback, selectedTab: p_tabName as HomeScreenTab });

        if (p_tabName === HomeScreenTab.Cast) {
            this._cloutCastFeedComponent?.current?.loadData();
        } else {
            this._postListComponent?.current?.refresh();
        }
    };

    render() {
        const renderTab = () => {
            switch (this.state.selectedTab) {
                case HomeScreenTab.Global:
                    return <PostListComponent
                        route={this.props.route}
                        ref={this._postListComponent}
                        selectedTab={this.state.selectedTab}
                        navigation={this.props.navigation}
                        api={api.getGlobalPosts} />;

                case HomeScreenTab.Following:
                    return <PostListComponent
                        route={this.props.route}
                        ref={this._postListComponent}
                        selectedTab={this.state.selectedTab}
                        navigation={this.props.navigation}
                        api={api.getFollowingPosts} />;

                case HomeScreenTab.Recent:
                    return <PostListComponent
                        route={this.props.route}
                        ref={this._postListComponent}
                        selectedTab={this.state.selectedTab}
                        navigation={this.props.navigation}
                        api={api.getRecentPosts} />;

                case HomeScreenTab.Cast:
                    return <CloutCastFeedComponent
                        ref={this._cloutCastFeedComponent}
                        route={this.props.route}
                        navigation={this.props.navigation}></CloutCastFeedComponent>
            }
        };

        return (
            <View style={[{ flex: 1 }, themeStyles.containerColorMain]}>
                <TabsComponent
                    tabs={this.state.tabs}
                    selectedTab={this.state.selectedTab}
                    onTabClick={this.onTabClick}
                />
                {
                    renderTab()
                }
            </View>
        );
    }
}
