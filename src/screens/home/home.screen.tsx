import React from 'react';
import { View } from 'react-native';
import { api, notificationsService } from '@services';
import { themeStyles } from '@styles';
import { eventManager } from '@globals';
import { EventType, NavigationEvent, Post } from '@types';
import { TabConfig, TabsComponent } from '@components/tabs.component';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { PostListComponent } from './components/postList.component';

enum HomeScreenTab {
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent'
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

    private _isMounted = false;
    private _postListComponent = React.createRef<PostListComponent>();
    private _unsubscribeNavigationEvent: any;

    constructor(props: Props) {

        super(props);
        this.state = {
            selectedTab: HomeScreenTab.Global,
            tabs: [],
            api: api.getGlobalPosts,
        };

        this.onTabClick = this.onTabClick.bind(this);
        this.configureTabs = this.configureTabs.bind(this);
        this.subscribeNavigationEvent();
    };

    componentDidMount() {
        this._isMounted = true;
        this.configureTabs();
        notificationsService.registerNotificationHandler();
    };

    componentWillUnmount() {
        this._isMounted = false;
        notificationsService.unregisterNotificationHandler();
        this._unsubscribeNavigationEvent()
    };

    init() {
        if (!this._postListComponent.current) {
            return;
        }
        this._postListComponent.current.init();
    };

    onTabClick(p_tabName: string) {
        let tab: any;
        if (p_tabName === HomeScreenTab.Global) {
            tab = api.getGlobalPosts
        } else if (p_tabName === HomeScreenTab.Following) {
            tab = api.getFollowingPosts
        } else {
            tab = api.getRecentPosts
        }
        this.setState({ api: tab, selectedTab: p_tabName as HomeScreenTab });
        this.init()
    };

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
    };

    configureTabs() {
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
        this.setState({ tabs: newTabs })
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
                        api={api.getGlobalPosts} />

                case HomeScreenTab.Following:
                    return <PostListComponent
                        route={this.props.route}
                        ref={this._postListComponent}
                        selectedTab={this.state.selectedTab}
                        navigation={this.props.navigation}
                        api={api.getFollowingPosts} />

                case HomeScreenTab.Recent:
                    return <PostListComponent
                        route={this.props.route}
                        ref={this._postListComponent}
                        selectedTab={this.state.selectedTab}
                        navigation={this.props.navigation}
                        api={api.getRecentPosts} />
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
