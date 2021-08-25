import React from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Dimensions, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { Post } from '@types';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { Profile } from '@types';
import { nftApi, calculateAndFormatBitCloutInUsd, api, snackbar } from '@services';
import { globals } from '@globals/globals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';
import { AntDesign } from '@expo/vector-icons';
import { signing } from '@services/authorization/signing';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    post: Post;
    selectedTab: string;
    isNftForSale?: boolean;
    handleOwnBidInfo: (minBid: number, serialNumber: number) => void;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    bids: Post[];
    isTransactionLoading: boolean;
}

export default class NFTBiddersScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isRefreshing: false,
            bids: [],
            isTransactionLoading: false
        };

        this.init = this.init.bind(this);
        this.cancelBid = this.cancelBid.bind(this);
        this.handleCancelBid = this.handleCancelBid.bind(this);
        this.init();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async init(): Promise<void> {
        if (this._isMounted) {
            this.setState({ isLoading: true });
        }
        let targetResponse = [];
        try {
            const response = await nftApi.getNftBids(this.props.post.ProfileEntryResponse?.PublicKeyBase58Check, this.props.post.PostHashHex);
            targetResponse =
                this.props.selectedTab === 'bidders' ||
                    this.props.selectedTab === 'myBids' ?
                    response.BidEntryResponses :
                    this.props.selectedTab === 'owners' &&
                    response.NFTEntryResponses;

            if (targetResponse) {
                if (this.props.selectedTab === 'myBids' || this.props.selectedTab === 'bidders') {
                    targetResponse.sort((a: any, b: any) => b.BidAmountNanos - a.BidAmountNanos);
                } else if (this.props.selectedTab === 'owners') {
                    const minBidsArray: number[] = [];
                    let serialNumber;
                    for (const response of targetResponse) {
                        minBidsArray.push(response.MinBidAmountNanos);
                        if (response.OwnerPublicKeyBase58Check === globals.user.publicKey) {
                            serialNumber = response.SerialNumber;
                        }
                    }
                    const minBidAmount = Math.min(...minBidsArray);
                    this.props.handleOwnBidInfo(minBidAmount, serialNumber);
                }

                if (this.props.selectedTab === 'myBids') {
                    targetResponse = targetResponse.filter((item: any) => item.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey);
                }
            }

            if (this._isMounted) {
                this.setState({ bids: targetResponse });
            }

        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false });
            }
        }
    }

    private calculateBidderBalance(bidderBalanceNanos: number): string {
        const balance = bidderBalanceNanos / 1000000000;
        const formattedNumber = balance.toFixed(3);
        return formattedNumber;
    }

    private goToProfile(profile: Profile): void {

        if (profile && profile?.Username !== 'anonymous') {
            this.props.navigation.push(
                'UserProfile',
                {
                    publicKey: profile?.PublicKeyBase58Check,
                    username: profile?.Username,
                    Key: 'Profile_' + profile?.PublicKeyBase58Check
                }
            );
        }
    }

    private async cancelBid(): Promise<void> {

        if (this._isMounted) {
            this.setState({ isTransactionLoading: true });
        }

        let targetBid: any;
        const filteredBids = this.state.bids.filter(
            (item: any) => {
                if (item.ProfileEntryResponse?.PublicKeyBase58Check !== globals.user.publicKey) {
                    return true;
                }
                targetBid = item;
                return false;
            }
        );
        try {
            const transactionResponse = await nftApi.placeNftBid(0, this.props.post.PostHashHex, targetBid.SerialNumber, targetBid.ProfileEntryResponse?.PublicKeyBase58Check);
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);
            if (this._isMounted) {
                this.setState({ bids: filteredBids });
            }
            snackbar.showSnackBar(
                {
                    text: 'Bid cancelled successfully'
                }
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {

            if (this._isMounted) {
                this.setState({ isTransactionLoading: false, });
            }
        }
    }

    private handleCancelBid(): void {
        Alert.alert(
            'Cancel Bid',
            'Are you sure you want to cancel this bid?',
            [
                {
                    text: 'Yes',
                    onPress: this.cancelBid
                },
                {
                    text: 'No',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const renderRightSwipe = (_progress: any, dragX: any): JSX.Element => {
            const scale = dragX.interpolate({
                inputRange: [-100, 0],
                outputRange: [1, 0.3],
                extrapolate: 'clamp',
            });

            return <TouchableOpacity
                style={{ backgroundColor: '#fc6360' }}
                activeOpacity={0.6}
                onPress={this.handleCancelBid}
            >
                <View style={[styles.deleteBox, themeStyles.borderColor]}>
                    {
                        this.state.isTransactionLoading ?
                            <ActivityIndicator color='white' /> :
                            <>
                                <AntDesign name="delete" size={20} color="white" />
                                <Animated.Text style={[
                                    { transform: [{ scale: scale }] },
                                    styles.deleteBoxText]} >Cancel Bid</Animated.Text>
                            </>
                    }
                </View>
            </TouchableOpacity>;
        };

        const keyExtractor = (item: Post, index: number): string => `${item.ProfileEntryResponse?.PublicKeyBase58Check}_${index.toString()}`;

        const renderItem = (item: Post): JSX.Element =>
            <Swipeable
                enabled={
                    (this.props.selectedTab === 'bidders' ||
                        this.props.selectedTab === 'myBids') &&
                    item.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey
                }
                renderRightActions={renderRightSwipe}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => this.goToProfile(item.ProfileEntryResponse)}
                    style=
                    {
                        [
                            styles.ownerCard,
                            themeStyles.containerColorMain,
                            themeStyles.borderColor
                        ]
                    }
                >
                    <View style={styles.profileRow}>
                        <ProfileInfoCardComponent
                            profile={item.ProfileEntryResponse}
                            navigation={this.props.navigation}
                        />
                    </View>
                    <View style={styles.rightContainer}>
                        <View style={
                            [
                                styles.serialNumberBox,
                                themeStyles.borderColor,
                                themeStyles.modalBackgroundColor
                            ]
                        }>
                            <Text style={[themeStyles.fontColorSub, styles.serialNumber]}>#{item.SerialNumber}</Text>
                        </View>
                        <Text style={[styles.balance, themeStyles.fontColorMain]}>
                            {
                                this.props.selectedTab === 'bidders' ||
                                    this.props.selectedTab === 'myBids' ?
                                    this.calculateBidderBalance((item as any).BidAmountNanos)
                                    : this.calculateBidderBalance((item as any).LastAcceptedBidAmountNanos)
                            }
                        </Text>
                        <Text style={[styles.coinPrice, themeStyles.fontColorMain]}>~$
                            {
                                this.props.selectedTab === 'bidders' ||
                                    this.props.selectedTab === 'myBids' ?
                                    calculateAndFormatBitCloutInUsd((item as any).BidAmountNanos) :
                                    calculateAndFormatBitCloutInUsd((item as any).LastAcceptedBidAmountNanos)
                            }
                        </Text>
                    </View>
                </TouchableOpacity>
            </Swipeable>;

        const renderRefresh: JSX.Element = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={this.init}
        />;

        return <View style={styles.container}>
            {
                this.state.bids === null ||
                    this.state.bids.length === 0 ?
                    <ScrollView refreshControl={renderRefresh} >
                        <Text style={[styles.emptyBidders, themeStyles.fontColorSub]}>
                            {
                                this.props.selectedTab === 'bidders' ?
                                    'No bidders for this post yet' :
                                    this.props.selectedTab === 'owners' ?
                                        'No owners for this post yet' :
                                        this.props.isNftForSale ?
                                            'Placing a bid for this post is not available at the moment' :
                                            'You have no bids yet, press on the Place a bid button to start!'
                            }
                        </Text>
                    </ScrollView> :
                    <>
                        <FlatList
                            data={this.state.bids}
                            keyExtractor={keyExtractor}
                            renderItem={({ item }) => renderItem(item)}
                            refreshControl={renderRefresh}
                        />
                    </>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        ownerCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('screen').width
        },
        profileRow: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        balance: {
            fontSize: 15,
            fontWeight: '600',
            paddingVertical: 5,
        },
        coinPrice: {
            fontSize: 13,
        },
        emptyBidders: {
            fontSize: 16,
            textAlign: 'center',
            margin: 20
        },
        rightContainer: {
            width: 60,
            justifyContent: 'center',
            alignItems: 'center'
        },
        serialNumberBox: {
            borderWidth: 1,
            width: 45,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 3,
        },
        serialNumber: {
            fontSize: 12
        },
        deleteBox: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: 90,
            borderBottomWidth: 1,
        },
        deleteBoxText: {
            color: 'white',
            paddingTop: 5,
            fontSize: 12
        }
    }
);
