import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import NFTBiddersScreen from './nftBidders.screen';
import { Post } from '@types';
import { globals } from '@globals/globals';
import { api, nftApi } from '@services';
import { signing } from '@services/authorization/signing';

type RouteParams = {
    bidders: {
        post: Post;
    },
};

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'bidders'>;
}

interface State {
    minBidAmountNanos: number;
    serialNumber: number;
    isNftForSale: boolean;
    isCloseAuctionButtonLoading: boolean;
    availableBids: number;
}

const NFTTab = createMaterialTopTabNavigator();

export default class NFTTabNavigator extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            minBidAmountNanos: 0,
            serialNumber: 0,
            isNftForSale: this.props.route.params.post.NumNFTCopiesForSale !== 0,
            isCloseAuctionButtonLoading: true,
            availableBids: this.props.route.params.post.NumNFTCopiesForSale
        };

        this.goToBidEditions = this.goToBidEditions.bind(this);
        this.closeOwnAuctionAlert = this.closeOwnAuctionAlert.bind(this);
        this.closeOwnAuction = this.closeOwnAuction.bind(this);
        this.handleOwnBidInfo = this.handleOwnBidInfo.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private goToBidEditions(): void {
        this.props.navigation.push(
            'BidEditions',
            {
                postHashHex: this.props.route.params.post?.PostHashHex,
                publicKey: this.props.route.params?.post.PosterPublicKeyBase58Check
            }
        );
    }

    private async closeOwnAuction(): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isCloseAuctionButtonLoading: true });
            }
            const transactionResponse = await nftApi.updateNftBid(
                this.state.minBidAmountNanos,
                this.props.route.params.post?.PostHashHex,
                this.state.serialNumber,
                this.props.route.params.post?.PosterPublicKeyBase58Check
            );
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);
            if (this._isMounted) {
                this.setState(
                    (prevState) => (
                        {
                            isNftForSale: false,
                            availableBids: prevState.availableBids - 1
                        }
                    )
                );
            }
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isCloseAuctionButtonLoading: false });
            }
        }
    }

    private closeOwnAuctionAlert(): void {
        Alert.alert(
            'Close Auction',
            'You are about to close the auction. This will cancel all bids on your NFT and prevent new bids from being submitted.',
            [
                {
                    text: 'Yes',
                    onPress: this.closeOwnAuction
                },
                {
                    text: 'Cancel',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    private handleOwnBidInfo(minBidAmountNanos: number, serialNumber: number): void {
        if (this._isMounted) {
            this.setState({ minBidAmountNanos, serialNumber, isCloseAuctionButtonLoading: false });
        }
    }

    render(): JSX.Element {

        const isOwnProfile = this.props.route.params.post.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey;

        return <View style={[{ flex: 1, }, themeStyles.containerColorMain]}>
            <View style={styles.headerContainer}>
                <Text style={[styles.availableNfts, themeStyles.fontColorMain]}>
                    <Text style={{ fontWeight: 'bold' }}>{this.state.availableBids} </Text>
                    of
                    <Text style={{ fontWeight: 'bold' }}> {this.props.route.params.post.NumNFTCopies} </Text>
                    availabe
                </Text>
                {
                    !globals.readonly && (
                        this.state.isNftForSale && !isOwnProfile &&
                        <TouchableOpacity
                            onPress={this.goToBidEditions}
                            activeOpacity={1}
                            style={[styles.bidEditionButton, themeStyles.verificationBadgeBackgroundColor]}>
                            <Text style={styles.bidEdition}>Place a bid</Text>
                        </TouchableOpacity>)
                }
                {
                    !globals.readonly && (
                        isOwnProfile && this.state.isNftForSale &&
                        <TouchableOpacity
                            onPress={this.closeOwnAuctionAlert}
                            activeOpacity={1}
                            style={[styles.closeBidButton, themeStyles.likeHeartBackgroundColor]}>
                            {
                                this.state.isCloseAuctionButtonLoading ?
                                    <ActivityIndicator color="white" /> :
                                    <Text style={styles.closeBid}>Close my auctions</Text>
                            }
                        </TouchableOpacity>
                    )
                }
            </View>
            <NFTTab.Navigator
                sceneContainerStyle={themeStyles.containerColorMain}
                tabBarOptions={{
                    style: themeStyles.containerColorMain,
                    indicatorStyle: { backgroundColor: themeStyles.fontColorMain.color },
                    tabStyle: { marginTop: 0 },
                    activeTintColor: themeStyles.fontColorMain.color,
                    labelStyle: { fontWeight: 'bold', textTransform: 'none' },
                    inactiveTintColor: themeStyles.fontColorSub.color,
                }}
            >
                <NFTTab.Screen name="Bidders" children=
                    {
                        props => <NFTBiddersScreen
                            {...props}
                            post={this.props.route.params.post}
                            selectedTab={'bidders'}
                            handleOwnBidInfo={this.handleOwnBidInfo}
                            navigation={this.props.navigation}
                        />
                    }
                />

                <NFTTab.Screen name="Owners" children=
                    {
                        props => <NFTBiddersScreen
                            {...props}
                            selectedTab={'owners'}
                            handleOwnBidInfo={this.handleOwnBidInfo}
                            post={this.props.route.params.post}
                            navigation={this.props.navigation}
                        />
                    }
                />

                <NFTTab.Screen name="My Bids" children=
                    {
                        props => <NFTBiddersScreen
                            {...props}
                            selectedTab={'myBids'}
                            isNftForSale={this.state.isNftForSale}
                            handleOwnBidInfo={this.handleOwnBidInfo}
                            post={this.props.route.params.post}
                            navigation={this.props.navigation}
                        />
                    }
                />
            </NFTTab.Navigator>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            padding: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        bidEditionButton: {
            width: 110,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
        },
        bidEdition: {
            fontWeight: '600',
            color: 'white'
        },
        closeBidButton: {
            width: 150,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
        },
        closeBid: {
            fontWeight: '600',
            color: 'white'
        },
        availableNfts: {
            fontSize: 16
        }
    }
);
