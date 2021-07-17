import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, Text, StyleSheet, Linking, Image, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { PostComponent } from '@components/post/post.component';
import { Post } from '@types';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { globals } from '@globals/globals';
import { api, loadTickersAndExchangeRate, cache, searchCloutApi } from '@services';
import { navigatorGlobals } from '@globals/navigatorGlobals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { Ionicons } from '@expo/vector-icons';
import { HotFeedFilter, HotFeedSettingsComponent } from './hotFeedSettings.component';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<ParamListBase, string>;
}

interface State {
    posts: Post[];
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    isFilterShown: boolean;
    filter: HotFeedFilter;
}

export class HotFeedComponent extends React.Component<Props, State> {

    private _flatListRef: React.RefObject<FlatList>;

    private _currentScrollPosition = 0;

    private _page = 0;

    private _noMoreData = false;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            posts: [],
            isLoading: true,
            isLoadingMore: false,
            isRefreshing: false,
            isFilterShown: false,
            filter: HotFeedFilter.Today
        };

        this._flatListRef = React.createRef();
        navigatorGlobals.refreshHome = () => {
            if (this._currentScrollPosition > 0 || !this._flatListRef.current) {
                this._flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
            } else {
                this.refresh(false);
            }
        };

        this.refresh();

        this.refresh = this.refresh.bind(this);
        this.goToSearchClout = this.goToSearchClout.bind(this);
        this.openSettings = this.openSettings.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    async refresh(p_showLoading = true): Promise<void> {
        if (this._isMounted && p_showLoading) {
            this.setState({ isLoading: true });
        } else if (this._isMounted) {
            this.setState({ isRefreshing: true });
        }

        this._currentScrollPosition = 0;
        this._page = 0;
        this._noMoreData = false;

        await loadTickersAndExchangeRate();
        await this.loadPosts(false);
    }

    private async loadPosts(p_loadMore: boolean) {
        if (this.state.isLoadingMore || this._noMoreData) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoadingMore: p_loadMore });
        }

        try {
            const filterKey = globals.user.publicKey + constants.localStorage_hotFeedFilter;
            const filterString = await SecureStore.getItemAsync(filterKey);
            const filter = filterString ? filterString as HotFeedFilter : HotFeedFilter.Today;

            const response = await searchCloutApi.getTrendingPosts(filter, this._page);
            const maxPage = response.pages;
            const postHashHexes = response.posts;

            this._page++;
            this._noMoreData = this._page >= maxPage;

            let allPosts: Post[] = [];
            const newPosts = await this.fetchPosts(postHashHexes);

            if (p_loadMore) {
                allPosts = this.state.posts?.concat(newPosts);
            } else {
                allPosts = newPosts;
            }

            allPosts = await this.processPosts(allPosts);

            if (this._isMounted) {
                this.setState({ posts: allPosts });
            }

        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoadingMore: false, isLoading: false, isRefreshing: false });
            }
        }
    }

    async fetchPosts(postHashHexes: string[]): Promise<Post[]> {
        const promises: Promise<Post | undefined>[] = [];

        for (const postHashHex of postHashHexes) {
            const promise = new Promise<Post | undefined>(
                (p_resolve) => {
                    api.getSinglePost(globals.user.publicKey, postHashHex, false, 0, 0).then(
                        response => {
                            p_resolve(response.PostFound);
                        }
                    ).catch(() => p_resolve(undefined));
                }
            );
            promises.push(promise);
        }

        const posts = await Promise.all(promises);
        const filteredPosts: Post[] = posts.filter(post => post != null) as Post[];

        return filteredPosts;
    }

    private async processPosts(p_posts: Post[]): Promise<Post[]> {
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
    }

    private goToSearchClout() {
        Linking.openURL('https://searchclout.net/');
    }

    private openSettings() {
        this.setState({ isFilterShown: true });
    }

    private async onSettingsChange(filter: HotFeedFilter) {
        try {
            if (filter === this.state.filter) {
                this.setState({ isFilterShown: false });
                return;
            }

            const filterKey = globals.user.publicKey + constants.localStorage_hotFeedFilter;
            await SecureStore.setItemAsync(filterKey, filter);

            if (this._isMounted) {
                this.setState({ filter, isFilterShown: false });
                this.refresh();
            }
        } catch {
            return;
        }
    }

    render(): JSX.Element {
        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const keyExtractor = (item: Post, index: number) => item.PostHashHex + String(index);
        const renderItem = (item: Post) => {
            return <PostComponent
                route={this.props.route}
                navigation={this.props.navigation}
                post={item} />;
        };
        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        const refreshControl = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={() => this.refresh(false)} />;

        const renderHeader = <View style={[styles.header, themeStyles.containerColorMain]}>
            <Image
                style={styles.searchCloutLogo}
                source={require('../../../../assets/searchclout.png')}
            ></Image>
            <Text style={[themeStyles.fontColorMain]} onPress={() => this.goToSearchClout()}>
                <Text style={[styles.headerLink, themeStyles.linkColor]} onPress={() => this.goToSearchClout()}>Powered by SearchClout</Text>
            </Text>

            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => this.openSettings()}
            >
                <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
            </TouchableOpacity>
        </View>;

        return (
            <>
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={this._flatListRef}
                        onMomentumScrollEnd={
                            (p_event: NativeSyntheticEvent<NativeScrollEvent>) => this._currentScrollPosition = p_event.nativeEvent.contentOffset.y
                        }
                        data={this.state.posts}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={keyExtractor}
                        renderItem={({ item }) => renderItem(item)}
                        onEndReached={() => this.loadPosts(true)}
                        stickyHeaderIndices={[0]}
                        initialNumToRender={3}
                        onEndReachedThreshold={3}
                        maxToRenderPerBatch={5}
                        windowSize={8}
                        refreshControl={refreshControl}
                        ListHeaderComponent={renderHeader}
                        ListFooterComponent={renderFooter}
                    />
                </View>
                {
                    this.state.isFilterShown &&
                    <HotFeedSettingsComponent
                        filter={this.state.filter}
                        isFilterShown={this.state.isFilterShown}
                        onSettingsChange={(filter: HotFeedFilter) => this.onSettingsChange(filter)}
                    />
                }
            </>
        );
    }
}

const styles = StyleSheet.create(
    {
        header: {
            paddingTop: 10,
            paddingLeft: 10,
            paddingBottom: 5,
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerLink: {
            fontWeight: '600'
        },
        searchCloutLogo: {
            height: 25,
            width: 25,
            marginRight: 5,
            borderRadius: 4
        },
        filterButton: {
            marginLeft: 'auto',
            marginRight: 8,
            paddingRight: 4,
            paddingLeft: 4
        }
    }
);
