import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { nftApi, calculateBitCloutInUSD, formatNumber, cache } from '@services';
import { globals } from '@globals/globals';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BidEdition, Post } from '@types';
import { eventManager } from '@globals/injector';
import { EventType } from '@types';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

type RouteParams = {
    bid: {
        postHashHex: string;
        publicKey: string;
    },
};

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'bid'>;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    bidEditions: BidEdition[];
    bidPost: Post | any;
}

export default class BidEditionsScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            bidEditions: [],
            bidPost: {},
            isRefreshing: false
        };

        this.init = this.init.bind(this);
        this.toggleBidModal = this.toggleBidModal.bind(this);

        this.init();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async init(isRefreshing = false): Promise<void> {
        try {
            if (isRefreshing && this._isMounted) {
                this.setState({ isRefreshing: true });
            }
            const responses = await Promise.all(
                [
                    cache.exchangeRate.getData(),
                    nftApi.getNftBidEditions(globals.user.publicKey, this.props.route.params.postHashHex),
                ]
            );
            const bidEditions = Object.values(responses[1].SerialNumberToNFTEntryResponse).filter((item: any) => item.OwnerPublicKeyBase58Check !== globals.user.publicKey) as BidEdition[];

            if (this._isMounted) {
                this.setState(
                    {
                        bidEditions,
                        bidPost: responses[1].NFTCollectionResponse.PostEntryResponse,
                    }
                );
            }

        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false, isRefreshing: false });
            }
        }
    }

    private toggleBidModal(bidEdition: BidEdition): void {
        if (this._isMounted) {
            eventManager.dispatchEvent(EventType.ToggleBidForm,
                {
                    visible: true,
                    post: this.state.bidPost,
                    bidEdition
                }
            );
        }
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const renderHeader: JSX.Element = <View >
            <Text style={[styles.title, themeStyles.fontColorMain]}>Select an edition</Text>
            <Text style={[themeStyles.fontColorSub, styles.subtitle]}>An NFT can have multiple editions, each with its own unique serial number.</Text>
        </View>;

        const renderRefresh: JSX.Element = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={() => this.init(true)} />;

        const keyExtractor = (item: BidEdition, index: number): string => `${String(item.SerialNumber)}_${index.toString()}`;

        const renderItem = (item: BidEdition): JSX.Element => <TouchableOpacity
            activeOpacity={1}
            style={[styles.editionCard, themeStyles.modalBackgroundColor]}
            onPress={() => this.toggleBidModal(item)}
        >
            <View style={styles.titleRow}>
                <Text style={[themeStyles.fontColorSub, styles.tableTitle]}>Serial Number</Text>
                <Text style={[themeStyles.fontColorMain, styles.record]}>#{item.SerialNumber}</Text>
            </View>
            <View style={styles.titleRow}>
                <Text style={[themeStyles.fontColorSub, styles.tableTitle]}>Highest Bid</Text>
                <Text style={[themeStyles.fontColorMain, styles.record]}>
                    {formatNumber(item.HighestBidAmountNanos / 1000000000, 3)}
                    {' '}DESO <Text style={themeStyles.fontColorSub}>(~${formatNumber(calculateBitCloutInUSD(item.HighestBidAmountNanos), 2)})</Text>
                </Text>
            </View>
            <View style={styles.titleRow}>
                <Text style={[themeStyles.fontColorSub, styles.tableTitle]}>Min Bid Amount</Text>
                <Text style={[themeStyles.fontColorMain, styles.record]}>
                    {formatNumber(item.MinBidAmountNanos / 1000000000, 3)}
                    {' '}DESO <Text style={themeStyles.fontColorSub}>(~${formatNumber(calculateBitCloutInUSD(item.MinBidAmountNanos), 2)})</Text>
                </Text>
            </View>
        </TouchableOpacity>;

        return <View style={[styles.container, themeStyles.containerColorMain]}>

            <FlatList
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListStyle}
                data={this.state.bidEditions}
                keyExtractor={keyExtractor}
                refreshControl={renderRefresh}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => renderItem(item)}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingHorizontal: 10,
            paddingTop: 10
        },
        flatListStyle: {
            paddingVertical: 10,
        },
        title: {
            fontSize: 18,
        },
        subtitle: {
            paddingVertical: 5,
            fontSize: 13,
        },
        editionCard: {
            padding: 5,
            borderRadius: 4,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.25,
            shadowRadius: 2.84,
            elevation: 3,
            marginVertical: 10,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 5,
        },
        tableTitle: {
            fontSize: 14
        },
        record: {
            fontSize: 12,
            width: '50%',
            textAlign: 'center'
        }
    }
);
