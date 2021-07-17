import { constants, globals, navigatorGlobals } from '@globals';
import { NavigationProp } from '@react-navigation/native';
import { api, cache, cloutCastApi } from '@services';
import { signing } from '@services/authorization/signing';
import { themeStyles } from '@styles/globalColors';
import { CloutCastPromotion, Post } from '@types';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, Text, StyleSheet, Linking, Image, TouchableOpacity } from 'react-native';
import { CloutCastPostComponent } from './cloutCastPost.component';
import * as SecureStore from 'expo-secure-store';
import { CloutCastIntroductionComponent } from './cloutCastIntroduction.component';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { Ionicons } from '@expo/vector-icons';
import { CloutCastFeedFilter, CloutCastFeedSettingsComponent, CloutCastFeedSort } from './cloutCastFeedSettings.component';

interface Props {
    navigation: NavigationProp<any> | any;
    route: any;
}

interface State {
    isFilterShown: boolean;
    introduction: boolean;
    isLoading: boolean;
    promotions: CloutCastPromotion[];
    isLoadingMore: boolean;
    isRefreshing: boolean;
    filter: CloutCastFeedFilter;
    sort: CloutCastFeedSort;
}

export class CloutCastFeedComponent extends React.Component<Props, State>{

    private _allPromotions: CloutCastPromotion[] = [];

    private _flatListRef: React.RefObject<FlatList>;

    private _currentScrollPosition = 0;

    private _blackList: string[] = [];

    private _lastEndIndex = 0;

    private _noMoreData = false;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isFilterShown: false,
            isLoading: true,
            promotions: [],
            isLoadingMore: false,
            isRefreshing: false,
            introduction: false,
            filter: CloutCastFeedFilter.ForMe,
            sort: CloutCastFeedSort.HighestPayout
        };

        this._flatListRef = React.createRef();
        navigatorGlobals.refreshHome = () => {
            if (this._currentScrollPosition > 0 || !this._flatListRef.current) {
                this._flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
            } else {
                this.loadData();
            }
        };

        this.init();
        this.loadData = this.loadData.bind(this);
        this.finishIntroduction = this.finishIntroduction.bind(this);
        this.goToCloutCast = this.goToCloutCast.bind(this);
        this.openSettings = this.openSettings.bind(this);
        this.onSettingsChange = this.onSettingsChange.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
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

    async loadData(): Promise<void> {
        try {
            this._noMoreData = false;
            this._lastEndIndex = 0;

            if (this._isMounted) {
                this.setState({ promotions: [], isLoading: true });
            }

            const filterKey = globals.user.publicKey + constants.localStorage_cloutCastFeedFilter;
            const filterString = await SecureStore.getItemAsync(filterKey);
            const filter = filterString ? filterString as CloutCastFeedFilter : CloutCastFeedFilter.ForMe;

            const sortKey = globals.user.publicKey + constants.localStorage_cloutCastFeedSort;
            const sortString = await SecureStore.getItemAsync(sortKey);
            const sort = sortString ? sortString as CloutCastFeedSort : CloutCastFeedSort.HighestPayout;

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
                        filter,
                        sort
                    }
                );
                const coinPrice = responses[0].ProfileEntryResponse?.CoinPriceBitCloutNanos;
                const followersCount = responses[1].NumFollowers;
                const promotions: CloutCastPromotion[] = responses[2].data;
                this._allPromotions = this.preProcessPromotions(promotions, filter, sort, coinPrice, followersCount);
                this._blackList = responses[3];
                this.loadPosts(false);
            }
        } catch {
            // TODO show error
        }
    }

    private preProcessPromotions(
        promotions: CloutCastPromotion[],
        filter: CloutCastFeedFilter,
        sort: CloutCastFeedSort,
        coinPrice: number,
        followersCount: number) {
        let returnValue = promotions;

        for (const promotion of promotions) {
            promotion.requirementsMet = this.checkRequirements(promotion, coinPrice, followersCount);
            promotion.alreadyPromoted = !!promotion.promoters?.find(
                promotion => promotion.publicKey === globals.user.publicKey
            );
        }

        if (filter === CloutCastFeedFilter.ForMe) {
            returnValue = returnValue.filter(promotion => promotion.requirementsMet && !promotion.alreadyPromoted);
        }

        if (sort === CloutCastFeedSort.HighestPayout) {
            returnValue = returnValue.sort((p1, p2) => p2.header.rate - p1.header.rate);
        } else if (sort === CloutCastFeedSort.LowestPayout) {
            returnValue = returnValue.sort((p1, p2) => p1.header.rate - p2.header.rate);
        }

        return returnValue;
    }

    private checkRequirements(promotion: CloutCastPromotion, coinPrice: number, followersCount: number): boolean {
        let valid = false;

        const criteria = promotion?.criteria;

        const minFollowers: number | undefined = criteria?.minFollowerCount;
        valid = minFollowers != null && minFollowers > 0 && followersCount >= minFollowers;

        if (valid) {
            const minCoinPrice: number | undefined = criteria.minCoinPrice;
            valid = minCoinPrice != null && minCoinPrice > 0 && coinPrice >= minCoinPrice;
        }

        if (!valid) {
            const allowedUsers = criteria.allowedUsers;
            valid = allowedUsers?.length > 0 && allowedUsers.indexOf(globals.user.publicKey) !== -1;
        }

        return valid;
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
            undefined;
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
                (p_resolve) => {
                    api.getSinglePost(globals.user.publicKey, promotion.target.hex, false, 0, 0).then(
                        p_response => {
                            promotion.post = p_response.PostFound;
                            p_resolve(true);
                        }
                    ).catch(() => p_resolve(false));
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
    }

    private finishIntroduction(): void {
        this.setState({ introduction: false });
        this.loadData();
    }

    private goToCloutCast() {
        Linking.openURL('https://cloutcast.io/');
    }

    private openSettings() {
        this.setState({ isFilterShown: true });
    }

    private async onSettingsChange(filter: CloutCastFeedFilter, sort: CloutCastFeedSort) {
        try {
            if (filter === this.state.filter && sort === this.state.sort) {
                this.setState({ isFilterShown: false });
                return;
            }

            const filterKey = globals.user.publicKey + constants.localStorage_cloutCastFeedFilter;
            await SecureStore.setItemAsync(filterKey, filter);

            const sortKey = globals.user.publicKey + constants.localStorage_cloutCastFeedSort;
            await SecureStore.setItemAsync(sortKey, sort);

            if (this._isMounted) {
                this.setState({ filter, sort, isFilterShown: false });
                this.loadData();
            }
        } catch {
            return;
        }
    }

    render(): JSX.Element {
        if (this.state.introduction) {
            return <CloutCastIntroductionComponent close={() => this.finishIntroduction()}></CloutCastIntroductionComponent>;
        }

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const keyExtractor = (item: CloutCastPromotion, index: number) => (item.post as Post).PostHashHex + String(index);
        const renderItem = this.state.promotions.length > 0 ?
            (item: CloutCastPromotion) => {
                return <CloutCastPostComponent
                    route={this.props.route}
                    navigation={this.props.navigation}
                    promotion={item} />;
            } :
            () => < Text
                style={[
                    styles.NoPromotionsText,
                    themeStyles.fontColorSub
                ]}>No promotions found</Text>;

        const renderHeader = <View style={[styles.header, themeStyles.containerColorMain]}>
            <Image
                style={styles.cloutCastLogo}
                source={require('../../../../assets/cloutCastLogo.png')}
            ></Image>
            <Text style={[themeStyles.fontColorMain]} onPress={() => this.goToCloutCast()}>
                <Text style={[styles.headerLink, themeStyles.linkColor]}>Powered by CloutCast</Text>
            </Text>

            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => this.openSettings()}
            >
                <Ionicons name="ios-filter" size={24} color={themeStyles.fontColorMain.color} />
            </TouchableOpacity>
        </View>;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading ?
            <ActivityIndicator color={themeStyles.fontColorMain.color} /> : undefined;

        return <>
            <FlatList
                ref={this._flatListRef}
                onMomentumScrollEnd={(p_event: any) => this._currentScrollPosition = p_event.nativeEvent.contentOffset.y}
                data={this.state.promotions.length > 0 ? this.state.promotions : [{ post: { PostHashHex: 'Empty' } }] as any[]}
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
                    onRefresh={() => this.loadData()}
                />
                }
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
            />
            {
                this.state.isFilterShown &&
                <CloutCastFeedSettingsComponent
                    filter={this.state.filter}
                    sort={this.state.sort}
                    isFilterShown={this.state.isFilterShown}
                    onSettingsChange={(filter: CloutCastFeedFilter, sort: CloutCastFeedSort) => this.onSettingsChange(filter, sort)}
                />
            }
        </>;
    }
}

const styles = StyleSheet.create(
    {
        header: {
            paddingLeft: 10,
            paddingBottom: 5,
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerLink: {
            fontWeight: '600'
        },
        cloutCastLogo: {
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
        },
        NoPromotionsText: {
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 30,
            fontWeight: '500'
        }
    }
);
