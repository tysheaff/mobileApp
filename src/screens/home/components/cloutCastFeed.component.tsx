import { constants, globals, navigatorGlobals } from "@globals";
import { NavigationProp } from "@react-navigation/native";
import { api, cache, cloutCastApi } from "@services";
import { signing } from "@services/authorization/signing";
import { themeStyles } from "@styles/globalColors";
import { CloutCastPromotion, Post } from "@types";
import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View, Text, StyleSheet, Linking } from "react-native";
import { CloutCastPostComponent } from "./cloutCastPost.component";
import * as SecureStore from 'expo-secure-store';
import { CloutCastIntroductionComponent } from "./cloutCastIntroduction.component";
import CloutFeedLoader from "@components/loader/cloutFeedLoader.component";

interface Props {
    navigation: NavigationProp<any> | any;
    route: any;
}

interface State {
    introduction: boolean;
    isLoading: boolean;
    promotions: CloutCastPromotion[];
    isLoadingMore: boolean;
    isRefreshing: boolean;
    followersCount: number;
    coinPrice: number;
}

export class CloutCastFeedComponent extends React.Component<Props, State>{

    private _allPromotions: CloutCastPromotion[] = [];
    private _flatListRef: React.RefObject<FlatList>;
    private _currentScrollPosition: number = 0;
    private _blackList: string[] = [];
    private _lastEndIndex = 0;

    private _noMoreData = false;
    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            promotions: [],
            isLoadingMore: false,
            isRefreshing: false,
            coinPrice: 0,
            followersCount: 0,
            introduction: false
        };

        this._flatListRef = React.createRef();
        navigatorGlobals.refreshHome = () => {
            if (this._currentScrollPosition > 0 || !this._flatListRef.current) {
                (this._flatListRef.current as any)?.scrollToOffset({ animated: true, offset: 0 });
            } else {
                this.loadData();
            }
        };

        this.init();
        this.loadData = this.loadData.bind(this);
        this.finishIntroduction = this.finishIntroduction.bind(this);
        this.goToCloutCast = this.goToCloutCast.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private async init() {
        const key = globals.user.publicKey + '_' + constants.localStorage_cloutCastIntroduction;
        const cloutCastIntroduction = await SecureStore.getItemAsync(key);

        if (cloutCastIntroduction) {
            this.loadData();
        } else {
            this.setState({ introduction: true });
        }
    }

    async loadData() {
        try {
            this._noMoreData = false;
            this._lastEndIndex = 0;

            if (this._isMounted) {
                this.setState({ promotions: [], isLoading: true });
            }

            const jwt = await signing.signJWT();
            const response = await cloutCastApi.authenticate(globals.user.publicKey, globals.user.username, jwt);

            globals.cloutCastToken = response.token;

            const responses = await Promise.all(
                [
                    cache.user.getData(),
                    api.getProfileFollowers('', globals.user.username, '', 0),
                    cloutCastApi.promotions(),
                    cloutCastApi.blacklist()
                ]
            );

            if (this._isMounted) {
                this.setState(
                    {
                        coinPrice: responses[0].ProfileEntryResponse?.CoinPriceBitCloutNanos,
                        followersCount: responses[1].NumFollowers
                    }
                );
                const promotions: CloutCastPromotion[] = responses[2].data;
                this._allPromotions = promotions.sort((p1, p2) => p2.header.rate - p1.header.rate);
                this._blackList = responses[3];
                this.loadPosts(false);
            }
        } catch {
            // TODO show error
        }
    }

    private async loadPosts(p_loadMore: boolean) {
        if (this.state.isLoadingMore || this._noMoreData) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        try {
            const batchSize = 8;
            const startIndex = this._lastEndIndex;
            this._lastEndIndex = startIndex + batchSize;
            const promotionsBatch = this._allPromotions.slice(startIndex, this._lastEndIndex);

            if (promotionsBatch.length < batchSize) {
                this._noMoreData = true;
            }

            let allPromotions = this.state.promotions;
            if (promotionsBatch?.length > 0) {
                await this.fetchPosts(promotionsBatch);
                const filteredPromotions = await this.processPosts(promotionsBatch);
                allPromotions = allPromotions.concat(filteredPromotions);
                if (this._isMounted) {
                    this.setState({ promotions: allPromotions });
                }
            }

        } catch {

        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false, isLoadingMore: false, isRefreshing: false });
            }
        }
    }

    private async fetchPosts(p_promotions: CloutCastPromotion[]): Promise<void> {
        const promises: Promise<boolean>[] = [];

        for (const promotion of p_promotions) {
            const promise = new Promise<boolean>(
                (p_resolve, _reject) => {
                    api.getSinglePost(globals.user.publicKey, promotion.target.hex, false, 0, 0).then(
                        p_response => {
                            promotion.post = p_response.PostFound;
                            p_resolve(true);
                        }
                    ).catch(() => p_resolve(false))
                }
            );
            promises.push(promise);
        }

        await Promise.all(promises);
    }

    private async processPosts(p_promotions: CloutCastPromotion[]): Promise<CloutCastPromotion[]> {
        let promotions: CloutCastPromotion[] = [];

        if (promotions) {
            const user = await cache.user.getData();
            const blockedUsers = user?.BlockedPubKeys ? user.BlockedPubKeys : [];
            promotions = p_promotions.filter(
                p_promotion => !!p_promotion.post?.ProfileEntryResponse &&
                    !p_promotion.post.IsHidden &&
                    !blockedUsers[p_promotion.post.ProfileEntryResponse.PublicKeyBase58Check] &&
                    !blockedUsers[p_promotion.post.RecloutedPostEntryResponse?.ProfileEntryResponse?.PublicKeyBase58Check] &&
                    this._blackList.indexOf(p_promotion.post.ProfileEntryResponse.PublicKeyBase58Check) === -1
            );
        }
        return promotions;
    };

    private async finishIntroduction() {
        this.setState({ introduction: false });
        this.loadData();
    }

    private goToCloutCast() {
        Linking.openURL('https://cloutcast.io/')
    }

    render() {
        if (this.state.introduction) {
            return <CloutCastIntroductionComponent close={this.finishIntroduction}></CloutCastIntroductionComponent>;
        }

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const keyExtractor = (item: CloutCastPromotion, index: number) => (item.post as Post).PostHashHex + index;
        const renderItem = (item: CloutCastPromotion) => {
            return <CloutCastPostComponent
                route={this.props.route}
                navigation={this.props.navigation}
                promotion={item}
                followersCount={this.state.followersCount}
                coinPrice={this.state.coinPrice} />
        };

        const renderHeader = <View style={[styles.header, themeStyles.containerColorMain]}>
            <Text style={[themeStyles.fontColorMain]} onPress={this.goToCloutCast}>Powered by
                <Text style={[styles.headerLink, themeStyles.linkColor]}> CloutCast</Text>
            </Text>
        </View>;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading ?
            <ActivityIndicator color={themeStyles.fontColorMain.color} /> : undefined;

        return <FlatList
            ref={this._flatListRef}
            onMomentumScrollEnd={(p_event: any) => this._currentScrollPosition = p_event.nativeEvent.contentOffset.y}
            data={this.state.promotions}
            showsVerticalScrollIndicator={true}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => renderItem(item)}
            onEndReached={() => this.loadPosts(true)}
            initialNumToRender={3}
            onEndReachedThreshold={3}
            maxToRenderPerBatch={5}
            windowSize={8}
            stickyHeaderIndices={[0]}
            refreshControl={<RefreshControl
                tintColor={themeStyles.fontColorMain.color}
                titleColor={themeStyles.fontColorMain.color}
                refreshing={this.state.isRefreshing}
                onRefresh={this.loadData}
            />
            }
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
        />
    }
}

const styles = StyleSheet.create(
    {
        header: {
            paddingLeft: 10,
            paddingBottom: 5
        },
        headerLink: {
            fontWeight: '500'
        }
    }
);
