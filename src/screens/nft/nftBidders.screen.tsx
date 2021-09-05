import React from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Dimensions, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { EventType, Post, ToggleSellNftModalEvent } from '@types';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { Profile } from '@types';
import { nftApi, calculateAndFormatBitCloutInUsd, api, snackbar } from '@services';
import { globals } from '@globals/globals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { signing } from '@services/authorization/signing';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { eventManager } from '@globals/injector';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    post: Post;
    selectedTab: string;
    isNftForSale?: boolean;
    numNFTCopies?: number;
    hasUnlockableContent?: boolean;
    selectModeOn?: boolean;
    refresh: any;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    bids: Post[];
    isTransactionLoading: boolean;
    isSellButtonLoading: boolean;
    isUnlockableTextModalVisible: boolean;
    unlockableText: string;
    selectedNftObj: any
}

export default class NFTBiddersScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isRefreshing: false,
            bids: [],
            isTransactionLoading: false,
            isSellButtonLoading: false,
            isUnlockableTextModalVisible: false,
            unlockableText: '',
            selectedNftObj: {}
        };

        this.init = this.init.bind(this);
        this.handleCancelBidAlert = this.handleCancelBidAlert.bind(this);
        this.handleCancelBid = this.handleCancelBid.bind(this);
        this.markNftForSale = this.markNftForSale.bind(this);

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

        let bids = [];

        try {
            const response = await nftApi.getNftBids(this.props.post.ProfileEntryResponse?.PublicKeyBase58Check, this.props.post.PostHashHex);
            bids = response.BidEntryResponses;

            if (bids) {
                bids.sort((a: any, b: any) => b.BidAmountNanos - a.BidAmountNanos);
                if (this.props.selectedTab === 'myBids') {
                    bids = bids.filter((item: any) => item.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey);
                }
            }

            if (this._isMounted) {
                this.setState({ bids });
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

    private async handleCancelBid(bid: Post): Promise<void> {
        if (this._isMounted) {
            this.setState({ isTransactionLoading: true });
        }

        let targetBid: any;

        const filteredBids = this.state.bids.filter(
            (item: Post) => {
                if (item.SerialNumber === bid.SerialNumber && item.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey) {
                    targetBid = item;
                    return false;
                }
                return true;
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

    private handleCancelBidAlert(bid: Post): void {
        Alert.alert(
            'Cancel Bid',
            'Are you sure you want to cancel this bid?',
            [
                {
                    text: 'Yes',
                    onPress: () => this.handleCancelBid(bid)
                },
                {
                    text: 'No',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    private markNftForSale(bid: Post): void {
        const selectedObj = this.state.selectedNftObj;
        selectedObj[bid.SerialNumber] = selectedObj[bid.SerialNumber] === bid.ProfileEntryResponse?.PublicKeyBase58Check ?
            false :
            bid.ProfileEntryResponse?.PublicKeyBase58Check;

        const bids = this.state.bids;

        if (this._isMounted) {
            this.setState({ selectedNftObj: { ...selectedObj } });
        }

        const selectedNftsForSale = bids.filter((item: Post) => !!selectedObj[item.SerialNumber] && selectedObj[item.SerialNumber] == item.ProfileEntryResponse?.PublicKeyBase58Check);
        const event: ToggleSellNftModalEvent = {
            selectedNftsForSale
        };
        eventManager.dispatchEvent(EventType.ToggleSetSelectedNfts, event);
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const renderRightCancelSwipe = (dragX: any, bid: Post): JSX.Element => {
            const scale = dragX.interpolate({
                inputRange: [-100, 0],
                outputRange: [1, 0.3],
                extrapolate: 'clamp',
            });

            return <TouchableOpacity
                style={{ backgroundColor: '#fc6360' }}
                activeOpacity={0.7}
                onPress={() => this.handleCancelBidAlert(bid)}
            >
                <View style={[styles.deleteBox, themeStyles.borderColor]}>
                    {
                        this.state.isTransactionLoading ?
                            <ActivityIndicator color='white' /> :
                            <>
                                <AntDesign name="delete" size={20} color="white" />
                                <Animated.Text style=
                                    {
                                        [
                                            { transform: [{ scale: scale }] },
                                            styles.deleteBoxText
                                        ]
                                    }
                                >
                                    Cancel Bid
                                </Animated.Text>
                            </>
                    }
                </View>
            </TouchableOpacity>;
        };

        const keyExtractor = (item: Post, index: number): string => `${item.ProfileEntryResponse?.PublicKeyBase58Check}_${index.toString()}`;

        const renderItem = (item: Post): JSX.Element =>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress=
                {
                    this.props.selectModeOn ?
                        () => this.markNftForSale(item) :
                        () => this.goToProfile(item.ProfileEntryResponse)
                }
                style=
                {
                    [
                        this.props.selectModeOn &&
                            this.state.selectedNftObj[item.SerialNumber] &&
                            this.state.selectedNftObj[item.ProfileEntryResponse?.PublicKeyBase58Check] ?
                            themeStyles.modalBackgroundColor :
                            themeStyles.containerColorMain,
                        themeStyles.borderColor,
                        styles.ownerCard
                    ]
                }
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {
                        this.props.selectModeOn && (
                            this.state.selectedNftObj[item.SerialNumber] &&
                                this.state.selectedNftObj[item.SerialNumber] === item.ProfileEntryResponse?.PublicKeyBase58Check ?
                                <MaterialCommunityIcons
                                    style={styles.checkBoxIcon}
                                    name="checkbox-marked"
                                    size={18}
                                    color={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                /> :
                                <MaterialCommunityIcons
                                    name="checkbox-blank-outline"
                                    size={18}
                                    style={styles.checkBoxIcon}
                                    color={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                />
                        )
                    }
                    <ProfileInfoCardComponent
                        profile={item.ProfileEntryResponse}
                        navigation={this.props.navigation}
                    />
                </View>
                <View style={styles.rightContainer}>
                    <View style=
                        {
                            [
                                styles.serialNumberBox,
                                themeStyles.borderColor,
                                themeStyles.modalBackgroundColor
                            ]
                        }
                    >
                        <Text style={[themeStyles.fontColorSub, styles.serialNumber]}>#{item.SerialNumber}</Text>
                    </View>
                    <Text style={[styles.balance, themeStyles.fontColorMain]}>
                        {this.calculateBidderBalance(item.BidAmountNanos)}
                    </Text>
                    <Text style={[styles.coinPrice, themeStyles.fontColorMain]}>
                        ~${calculateAndFormatBitCloutInUsd(item.BidAmountNanos)}
                    </Text>
                </View>
            </TouchableOpacity>;

        const renderSwipableItem = (item: Post): JSX.Element => <Swipeable
            rightThreshold={40}
            renderRightActions=
            {
                (_progress: any, dragX: any) => renderRightCancelSwipe(dragX, item)
            }
        >
            {renderItem(item)}
        </Swipeable >;

        const renderListItem = ({ item }: { item: Post }): JSX.Element => item.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey ?
            renderSwipableItem(item) : renderItem(item);

        const renderRefresh: JSX.Element = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={() => this.props.refresh(true)}
        />;

        return <View style={styles.container}>
            {
                this.state.bids === null ||
                    this.state.bids.length === 0 ?
                    <ScrollView refreshControl={renderRefresh} >
                        <Text style={[styles.emptyBidders, themeStyles.fontColorSub]}>
                            {
                                this.props.selectedTab === 'bidders' && (
                                    this.props.isNftForSale ?
                                        'There are no bids yet' :
                                        'This NFT is not on sale'
                                )
                            }
                        </Text>
                    </ScrollView> :
                    <>
                        <FlatList
                            data={this.state.bids}
                            keyExtractor={keyExtractor}
                            renderItem={renderListItem}
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
            zIndex: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('screen').width
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
            fontSize: 13
        },
        checkBoxIcon: {
            marginRight: 8
        }
    }
);
