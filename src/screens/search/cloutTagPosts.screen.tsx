import { themeStyles } from '@styles/globalColors';
import React from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { cloutApi } from '@services/api/cloutApi';
import { globals } from '@globals/globals';
import { CloutTag, Post } from '@types'
import { PostComponent } from '@components/post/post.component';
import { api, cache } from '@services';

type RouteParams = {
    CloutTag: {
        Tag: CloutTag;
    }
};

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'CloutTag'> | any;
}

interface State {
    posts: Post[];
    isLoading: boolean;
    isRefreshing: boolean;
    isLoadingMore: boolean;
}

export default class CloutTagPostsScreen extends React.Component<Props, State> {

    private _isMounted = false;
    private _noMoreData = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            posts: [],
            isLoading: true,
            isLoadingMore: false,
            isRefreshing: false,
        };

        this.init = this.init.bind(this);
        this.refresh = this.refresh.bind(this);
        this.init(false);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        globals.lastCloutTagPostIndex = 0;
    }

    async processPosts(p_posts: Post[]): Promise<Post[]> {
        const user = await cache.user.getData();
        const blockedUsers = user?.BlockedPubKeys ? user.BlockedPubKeys : [];
        let filteredPosts: Post[] = p_posts.filter((p_post: Post) =>
            !!p_post.ProfileEntryResponse &&
            !p_post.IsHidden &&
            !blockedUsers[p_post.ProfileEntryResponse.PublicKeyBase58Check] &&
            !blockedUsers[p_post.RecloutedPostEntryResponse?.ProfileEntryResponse?.PublicKeyBase58Check]
        )
        return filteredPosts;
    }

    async init(p_loadMore: boolean) {

        if (this.state.isLoadingMore || this._noMoreData) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        let promises: Promise<Post>[] = [];
        let post: Post | any;
        let posts: Post[];
        try {
            const response = await cloutApi.getCloutTagPosts(this.props.route.params?.cloutTag, 10, globals.lastCloutTagPostIndex);
            if (response.data < 10 && this._isMounted) {
                this._noMoreData = true;
            }
            if (response?.length > 0) {
                for (const newPost of response) {
                    const promise = new Promise<Post | any>(
                        async (p_resolve, _reject) => {
                            try {
                                post = await api.getSinglePost(globals.user.publicKey, newPost, true, 0, 0);
                                p_resolve(post?.PostFound);
                            }
                            catch {
                                p_resolve(undefined);
                            }
                        }
                    );
                    promises.push(promise);
                }

                globals.lastCloutTagPostIndex += response.length;
                if (p_loadMore) {
                    posts = this.state.posts.concat(await Promise.all(promises));
                } else {
                    posts = await Promise.all(promises);
                }

                let filteredPosts = await this.processPosts(posts);

                if (this._isMounted) {
                    this.setState({ posts: filteredPosts, isLoadingMore: false, isLoading: false });
                }

            } else {
                if (this._isMounted) {
                    this.setState({ isLoadingMore: false });
                    globals.lastCloutTagPostIndex = 0;
                }
            }

        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    refresh() {
        globals.lastCloutTagPostIndex = 0;
        this.init(false);
    }

    render() {

        const keyExtractor = (item: Post, index: number) => `${item.PostHashHex}_${index}`;

        const renderItem = (item: Post) => <PostComponent
            route={this.props.route}
            navigation={this.props.navigation}
            post={item} />;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        const renderRefresh = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={this.refresh} />

        return (
            <View style={[styles.container, themeStyles.containerColorMain]}>
                {this.state.isLoading
                    ? <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color} />
                    : <FlatList
                        data={this.state.posts}
                        keyExtractor={keyExtractor}
                        renderItem={({ item }) => renderItem(item)}
                        onEndReachedThreshold={3}
                        maxToRenderPerBatch={5}
                        onEndReached={() => this.init(true)}
                        ListFooterComponent={renderFooter}
                        refreshControl={renderRefresh}
                    />
                }
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    activityIndicator: {
        height: 200,
        alignSelf: 'center'
    }
})