import React from "react";
import { FlatList, View, RefreshControl, ActivityIndicator } from 'react-native';
import { PostComponent } from '../../../components/post/post.component'
import { Post, User } from '@types';
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { themeStyles } from "@styles/globalColors";
import { globals } from "@globals/globals";
import { cache } from "@services/dataCaching";
import { loadTickersAndExchangeRate } from "@services/bitCloutCalculator";
import { api } from "@services/api";
import { navigatorGlobals } from "@globals/navigatorGlobals";
import { cloutFeedApi } from "@services/cloutfeedApi";

enum HomeScreenTab {
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent'
};

type RouteParams = {
    Home: {
        newPost: Post;
        deletedPost: Post;
        blockedUser: User;
    }
};

interface Props {
    navigation: NavigationProp<any> | any;
    selectedTab: HomeScreenTab;
    route: RouteProp<RouteParams, 'Home'> | any;
    api: any;
};

interface State {
    posts: Post[];
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
};

export class PostListComponent extends React.Component<Props, State> {

    private _flatListRef: React.RefObject<FlatList>;
    private _isMounted = false;
    private _postsCountPerLoad = 10;
    private _currentScrollPosition: number = 0;

    constructor(props: Props) {
        super(props);

        this.state = {
            posts: [],
            isLoading: true,
            isLoadingMore: false,
            isRefreshing: false,
        };

        navigatorGlobals.refreshHome = () => {
            if (this._currentScrollPosition > 0 || !this._flatListRef.current) {
                (this._flatListRef.current as any)?.scrollToOffset({ animated: true, offset: 0 });
            } else {
                this.refresh();
            }
        };

        this._flatListRef = React.createRef();
        this.loadMorePosts = this.loadMorePosts.bind(this);
        this.processPosts = this.processPosts.bind(this);
        this.getPinnedPost = this.getPinnedPost.bind(this);
        this.refresh = this.refresh.bind(this);

        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    };

    componentWillUnmount() {
        this._isMounted = false;
    };

    componentDidUpdate() {
        if (this.props.route.params?.newPost) {
            const newPostFound = this.state.posts?.find((p_post: Post) => p_post.PostHashHex === this.props.route.params.newPost.PostHashHex);
            if (!newPostFound) {
                let newPosts = [this.props.route.params.newPost].concat(this.state.posts ? this.state.posts : []);
                if (this._isMounted) {
                    this.setState({ posts: newPosts })
                }
            }
            this.props.route.params.newPost = undefined;
        };

        if (this.props.route.params?.deletedPost) {
            const posts = this.state.posts?.filter(p_post =>
                p_post.PostHashHex != this.props.route.params.deletedPost);
            if (this._isMounted && posts) {
                this.setState({ posts })
            }
            this.props.route.params.deletedPost = undefined;
        };

        if (this.props.route.params?.blockedUser) {
            const posts = this.state.posts?.filter(p_post => p_post.ProfileEntryResponse?.PublicKeyBase58Check != this.props.route.params.blockedUser);
            if (this._isMounted && posts) {
                this.setState({ posts })
            }
            this.props.route.params.blockedUser = undefined;
        };
    };

    async init() {
        await loadTickersAndExchangeRate();
        await this.loadMorePosts(false);
    };

    async processPosts(p_posts: Post[]): Promise<Post[]> {
        let posts: Post[] = [];
        if (posts) {
            const user = await cache.user.getData();
            const blockedUsers = user?.BlockedPubKeys ? user.BlockedPubKeys : [];
            posts = p_posts.filter(
                p_post => !!p_post.ProfileEntryResponse &&
                    !p_post.IsHidden &&
                    !blockedUsers[p_post.ProfileEntryResponse.PublicKeyBase58Check] &&
                    !blockedUsers[p_post.RecloutedPostEntryResponse?.ProfileEntryResponse?.PublicKeyBase58Check]
            );
        }
        return posts;
    };

    async getPinnedPost(): Promise<Post | undefined> {
        let post: Post | undefined = undefined;
        try {
            const response = await cloutFeedApi.getPinnedPost();
            const pinnedPost = response.pinnedPost;
            if (pinnedPost) {
                const postResponse = await api.getSinglePost(globals.user.publicKey, pinnedPost, false, 0, 0);
                post = postResponse?.PostFound as Post;
            }

        } catch { }
        return post;
    };

    async loadMorePosts(p_loadMore: boolean) {
        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        const post: Post | undefined = !p_loadMore && this.props.selectedTab === 'Global' ? await this.getPinnedPost() : undefined;
        let callback = this.props.api
        const lastPosHash = this.state.posts && this.state.posts.length > 0 && p_loadMore ? this.state.posts[this.state.posts.length - 1].PostHashHex : undefined;

        try {
            const response = await callback(globals.user.publicKey, this._postsCountPerLoad, lastPosHash)
            let allPosts: Post[] = [];
            let posts = response.PostsFound as Post[];
            if (this.props.selectedTab === HomeScreenTab.Global && post) {
                posts?.unshift(post);
            }
            if (p_loadMore) {
                allPosts = this.state.posts?.concat(posts);
            } else {
                allPosts = posts;
            }

            posts = await this.processPosts(allPosts);
            if (this._isMounted) {
                this.setState({ posts });
            }
        } catch (p_error: any) {
            globals.defaultHandleError(p_error)
        } finally {
            if (this._isMounted) {
                this.setState({ isLoadingMore: false, isLoading: false, isRefreshing: false });
            }
        }
    };

    async refresh() {
        await loadTickersAndExchangeRate();
        this.loadMorePosts(false);
    };

    render() {
        if (this.state.isLoading) {
            return <ActivityIndicator style={{ height: 200, alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
        }
        const keyExtractor = (item: any, index: number) => item.PostHashHex + index;
        const renderItem = (item: Post) => {
            return <PostComponent
                route={this.props.route}
                navigation={this.props.navigation}
                post={item} />
        }

        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={this._flatListRef}
                    onMomentumScrollEnd={
                        (p_event: any) => this._currentScrollPosition = p_event.nativeEvent.contentOffset.y}
                    data={this.state.posts}
                    showsVerticalScrollIndicator={true}
                    keyExtractor={keyExtractor}
                    renderItem={({ item }) => renderItem(item)}
                    onEndReached={() => this.loadMorePosts(true)}
                    onEndReachedThreshold={3}
                    maxToRenderPerBatch={5}
                    windowSize={8}
                    refreshControl={<RefreshControl
                        tintColor={themeStyles.fontColorMain.color}
                        titleColor={themeStyles.fontColorMain.color}
                        refreshing={this.state.isRefreshing}
                        onRefresh={this.refresh} />
                    }
                    ListFooterComponent={this.state.isLoadingMore && !this.state.isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color} /> : undefined}
                />
            </View>
        )
    }
};