import { themeStyles } from '@styles/globalColors';
import React from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { cloutApi } from '@services/api/cloutApi';
import { globals } from '@globals/globals';
import { CloutTag, Post } from '@types'
import { PostComponent } from '@components/post/post.component';
import { api, cache } from '@services';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

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

    private _isMounted: boolean = false;
    private _noMoreData: boolean = false;
    private _lastCloutTagPostIndex: number = 0;

    constructor(props: Props) {
        super(props);

        this.state = {
            posts: [],
            isLoading: true,
            isLoadingMore: false,
            isRefreshing: false,
        };

        this.loadData = this.loadData.bind(this);
        this.refresh = this.refresh.bind(this);
        this.loadData(false);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async processPosts(p_posts: Post[]): Promise<Post[]> {
        const user = await cache.user.getData();
        const blockedUsers = user?.BlockedPubKeys ? user.BlockedPubKeys : [];
        const filteredPosts: Post[] = p_posts.filter(
            p_post => !!p_post.ProfileEntryResponse &&
                !p_post.IsHidden &&
                !blockedUsers[p_post.ProfileEntryResponse.PublicKeyBase58Check] &&
                !blockedUsers[p_post.RecloutedPostEntryResponse?.ProfileEntryResponse?.PublicKeyBase58Check]
        );
        return filteredPosts;
    }

    async loadData(p_loadMore: boolean) {

        if (this.state.isLoadingMore || this._noMoreData) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        const promises: Promise<Post>[] = [];

        try {
            const cloutTagPosts = await cloutApi.getCloutTagPosts(this.props.route.params?.cloutTag, 10, this._lastCloutTagPostIndex);

            if (!cloutTagPosts || cloutTagPosts.length < 10) {
                this._noMoreData = true;
            }

            if (cloutTagPosts?.length > 0) {
                for (const postHashHex of cloutTagPosts) {
                    const promise = new Promise<Post | any>(
                        async (p_resolve, _reject) => {
                            try {
                                const response = await api.getSinglePost(globals.user.publicKey, postHashHex, true, 0, 0);
                                p_resolve(response?.PostFound);
                            }
                            catch {
                                p_resolve(undefined);
                            }
                        }
                    );
                    promises.push(promise);
                }

                this._lastCloutTagPostIndex += cloutTagPosts.length;

                let posts = await Promise.all(promises);
                posts = await this.processPosts(posts);

                if (p_loadMore) {
                    posts = this.state.posts.concat(await Promise.all(promises));
                }

                if (this._isMounted) {
                    this.setState({ posts });
                }
            }
            if (this._isMounted) {
                this.setState({ isLoadingMore: false, isLoading: false, isRefreshing: false });
            }

        } catch {
        }
    }

    refresh() {
        this._lastCloutTagPostIndex = 0;
        this.loadData(false);
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
                {
                    this.state.isLoading
                        ? <CloutFeedLoader />
                        : <FlatList
                            initialNumToRender={3}
                            data={this.state.posts}
                            keyExtractor={keyExtractor}
                            renderItem={({ item }) => renderItem(item)}
                            onEndReachedThreshold={3}
                            maxToRenderPerBatch={5}
                            onEndReached={() => this.loadData(true)}
                            ListFooterComponent={renderFooter}
                            refreshControl={renderRefresh}
                        />
                }
            </View>
        );
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        }
    }
);