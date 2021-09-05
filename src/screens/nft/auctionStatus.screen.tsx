import { globals } from '@globals/globals';
import { api, cache, calculateBitCloutInUSD, formatNumber, nftApi, snackbar } from '@services';
import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { Post } from '@types';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { signing } from '@services/authorization/signing';
import Modal from 'react-native-modal';
import { settingsGlobals } from '@globals/settingsGlobals';
import CloutFeedButton from '@components/cloutfeedButton.component';

interface Props {
    selectedTab: string;
    post: Post,
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    isButtonLoading: boolean,
    isModalButtonLoading: boolean;
    auctions: any[];
    selectedAuctions: Post[];
    selectedSerialNumbers: number[];
    areAllAuctionsSelected: boolean;
    isAuctionPriceModalVisible: boolean;
    usd: string;
    clout: string;
    isUsd: boolean;
    ownUserBalance: number;
}

export default class AuctionStatusScreen extends React.Component<Props, State> {

    private _isMounted = false;

    private _currentSelectedEditions: Post[] = [];

    private _currentSelectedSerialNumbers: number[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isRefreshing: false,
            auctions: [],
            selectedAuctions: [],
            selectedSerialNumbers: [],
            areAllAuctionsSelected: false,
            isButtonLoading: false,
            isAuctionPriceModalVisible: false,
            usd: '0',
            clout: '0',
            isUsd: false,
            ownUserBalance: 0,
            isModalButtonLoading: false
        };

        this.init = this.init.bind(this);
        this.handleSelectAllAuctions = this.handleSelectAllAuctions.bind(this);
        this.handleOwnAuction = this.handleOwnAuction.bind(this);
        this.handleOwnAuctionAlert = this.handleOwnAuctionAlert.bind(this);
        this.setCloutAmount = this.setCloutAmount.bind(this);
        this.setUsdAmount = this.setUsdAmount.bind(this);
        this.toggleCurrencyTransfer = this.toggleCurrencyTransfer.bind(this);

        this.init(false);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async init(isRefreshing: boolean): Promise<void> {
        if (isRefreshing && this._isMounted) {
            this.setState({ isRefreshing: true });
        }
        try {
            const auctionsOnSale = [];
            const closedAuctions = [];
            const responses = await Promise.all(
                [
                    nftApi.getNftBids(globals.user.publicKey, this.props.post.PostHashHex),
                    cache.exchangeRate.getData(),
                    cache.user.getData()
                ]
            );
            const auctions = responses[0].NFTEntryResponses.sort((a: Post, b: Post) => a.SerialNumber - b.SerialNumber);
            const ownUserBalance = responses[2].BalanceNanos;
            for (const auction of auctions) {
                if (auction?.OwnerPublicKeyBase58Check === globals.user.publicKey) {
                    if (auction.IsForSale) {
                        auctionsOnSale.push(auction);
                    } else {
                        closedAuctions.push(auction);
                    }
                }
            }
            const targetResponse = this.props.selectedTab === 'onSale' ? auctionsOnSale : closedAuctions;
            if (this._isMounted) {
                this.setState({ auctions: targetResponse, ownUserBalance });
            }

        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false, isRefreshing: false });
            }
        }
    }

    private handleSelectEdition(edition: Post): void {
        if (!this._currentSelectedSerialNumbers.includes(edition.SerialNumber)) {
            this._currentSelectedSerialNumbers.push(edition.SerialNumber);
            this._currentSelectedEditions.push(edition);
        } else {
            const index = this._currentSelectedEditions.indexOf(edition);
            const serialNumberIndex = this._currentSelectedSerialNumbers.indexOf(edition.SerialNumber);
            if (index > -1 || serialNumberIndex > -1) {
                this._currentSelectedEditions.splice(index, 1);
                this._currentSelectedSerialNumbers.splice(serialNumberIndex, 1);
            }
        }

        if (this._isMounted) {
            this.setState(
                {
                    selectedAuctions: this._currentSelectedEditions,
                    selectedSerialNumbers: this._currentSelectedSerialNumbers
                }
            );
        }
    }

    private handleSelectAllAuctions(): void {
        if (this.state.areAllAuctionsSelected) {
            this._currentSelectedSerialNumbers = [];
            this._currentSelectedEditions = [];
            if (this._isMounted) {
                this.setState(
                    {
                        areAllAuctionsSelected: false,
                        selectedAuctions: [],
                        selectedSerialNumbers: [],
                    }
                );
            }
        } else {
            for (const auction of this.state.auctions) {
                if (!this._currentSelectedSerialNumbers.includes(auction.SerialNumber)) {
                    this._currentSelectedSerialNumbers.push(auction.SerialNumber);
                    this._currentSelectedEditions.push(auction);
                }
            }
            if (this._isMounted) {
                this.setState(
                    {
                        selectedAuctions: this._currentSelectedEditions,
                        selectedSerialNumbers: this._currentSelectedSerialNumbers,
                        areAllAuctionsSelected: true
                    }
                );
            }
        }
    }

    private async handleUpdateAuction(auction: Post): Promise<void> {
        const bidAmountNanos = Number(this.state.clout.split(',').join('.')) * 1000000000;

        const newBidAmountNanos = bidAmountNanos === 0 ? auction.MinBidAmountNanos : bidAmountNanos;
        const isForSale = this.props.selectedTab === 'onSale' ? false : true;
        const transactionResponse = await nftApi.updateNftBid(
            isForSale,
            newBidAmountNanos,
            this.props.post.PostHashHex,
            auction.SerialNumber,
            globals.user.publicKey
        );
        const transactionHex: string = transactionResponse.TransactionHex;

        const signedTransactionHex = await signing.signTransaction(transactionHex);
        await api.submitTransaction(signedTransactionHex);
    }

    private async handleOwnAuction(): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isButtonLoading: true, isModalButtonLoading: true });
            }

            for (const auction of this.state.selectedAuctions) {
                await this.handleUpdateAuction(auction);
            }
            const filteredAuctions = this.state.auctions.filter((auction: Post) => !this.state.selectedSerialNumbers.includes(auction.SerialNumber));
            if (this._isMounted) {
                this.setState(
                    {
                        auctions: filteredAuctions,
                        areAllAuctionsSelected: false,
                        selectedSerialNumbers: [],
                        selectedAuctions: []
                    }
                );
            }
            this._currentSelectedEditions = [];
            this._currentSelectedSerialNumbers = [];
            const text = this.props.selectedTab === 'onSale' ? 'Auction(s) closed successfully' : 'Auction(s) opened successfully';

            snackbar.showSnackBar({ text });
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this.props.selectedTab === 'closed' && this._isMounted) {
                this.setState({ isAuctionPriceModalVisible: false });
            }
            if (this._isMounted) {
                this.setState({ isButtonLoading: false, isModalButtonLoading: false });
            }
        }
    }

    private handleOwnAuctionAlert(): void {
        if (!this.isBidFormValid()) {
            return;
        }

        const closeTitleType = this.state.selectedAuctions.length === 1 ? 'Close Auction' : 'Close Auctions';
        const openTitleType = this.state.selectedAuctions.length === 1 ? 'Put on Sale' : 'Open Auctions';
        const title = this.props.selectedTab === 'onSale' ? closeTitleType : openTitleType;
        const body = this.props.selectedTab === 'onSale' ?
            'You are about to close the auction(s). This will cancel all bids on your NFT and prevent new bids from being submitted.' :
            'Are you sure you want to put the selected NFT(s) on sale?';

        Alert.alert(title, body,
            [
                {
                    text: 'Yes',
                    onPress: this.handleOwnAuction
                },
                {
                    text: 'Cancel',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    private toggleAuctionPriceModal(isAuctionPriceModalVisible: boolean): void {
        if (this._isMounted) {
            this.setState({ isAuctionPriceModalVisible });
        }
    }

    private isBidFormValid() {

        if (this.state.clout.length === 0 || this.state.usd.length === 0) {
            Alert.alert('Error', 'Bid amount is empty');
            return false;
        }
        return true;
    }

    private setCloutAmount(clout: string): void {
        const parsedClout = Number(clout.split(',').join('.'));

        const usd = ((parsedClout * globals.exchangeRate.USDCentsPerBitCloutExchangeRate) / 100).toFixed(2);
        if (this._isMounted && !isNaN(parsedClout)) {
            this.setState({ clout, usd });
        }
    }

    private setUsdAmount(usd: string): void {
        const parsedUsd = Number(usd.split(',').join('.'));
        const clout = ((parsedUsd * 100) / globals.exchangeRate.USDCentsPerBitCloutExchangeRate).toFixed(4);
        if (this._isMounted && !isNaN(parsedUsd)) {
            this.setState({ usd, clout: clout });
        }
    }

    private toggleCurrencyTransfer(): void {
        if (this._isMounted) {
            this.setState({ isUsd: !this.state.isUsd });
        }
    }

    render(): JSX.Element {

        const currencyLabel = this.state.isUsd ? 'USD' : 'CLOUT';
        const keyboardVerticalOffset = Platform.OS === 'ios' ? 10 : 0;
        const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

        const buttonTitle = this.props.selectedTab === 'onSale' ? 'Close auctions' : 'Put on Sale';
        const isButtonDisabled = this.state.selectedAuctions.length === 0;
        const closeAuctionButtonColor = isButtonDisabled ?
            { backgroundColor: 'rgba(235, 27, 12, 0.6)' } :
            themeStyles.likeHeartBackgroundColor;
        const openAuctionButtonColor = isButtonDisabled ?
            { backgroundColor: 'rgba(0, 126, 245, 0.6)' } :
            themeStyles.verificationBadgeBackgroundColor;

        const buttonBackgroundColor = this.props.selectedTab === 'onSale' ?
            closeAuctionButtonColor :
            openAuctionButtonColor;
        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const renderRefresh: JSX.Element = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={() => this.init(true)} />;

        const keyExtractor = (auction: Post, index: number): string => `${auction.PostHashHex}_${index.toString()}`;
        const renderItem = (item: Post): JSX.Element => <>
            <TouchableOpacity
                style=
                {
                    [
                        styles.rowContainer,
                        themeStyles.borderColor,
                        this.state.selectedSerialNumbers.includes(item.SerialNumber) && themeStyles.modalBackgroundColor
                    ]
                }
                activeOpacity={0.8}
                onPress={() => this.handleSelectEdition(item)}
            >
                <View style={styles.leftRow}>
                    {
                        this.state.selectedSerialNumbers.includes(item.SerialNumber) ?
                            <MaterialCommunityIcons name="checkbox-marked" size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} /> :
                            <MaterialCommunityIcons name="checkbox-blank-outline" size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} />
                    }
                    <Text style={[themeStyles.fontColorMain, styles.serialNumber]}>#{item.SerialNumber}</Text>
                </View>
                <Text style={themeStyles.fontColorMain}>
                    {formatNumber(item.MinBidAmountNanos / 1000000000, true, 3)} CLOUT
                    <Text style={themeStyles.fontColorSub}> (~${formatNumber(calculateBitCloutInUSD(item.MinBidAmountNanos), true)})</Text>
                </Text>
            </TouchableOpacity>
        </>;

        const renderFooter = <TouchableOpacity
            activeOpacity={0.8}
            disabled={isButtonDisabled}
            onPress={this.props.selectedTab === 'onSale' ? this.handleOwnAuctionAlert : () => this.toggleAuctionPriceModal(true)}
            style={[styles.closeBidButton, buttonBackgroundColor]
            }
        >
            {
                this.state.isButtonLoading ?
                    <ActivityIndicator color="white" /> :
                    <Text style={styles.closeBid}>{buttonTitle}</Text>
            }
        </TouchableOpacity>;

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.auctions.length === 0 ?
                    <ScrollView refreshControl={renderRefresh} >
                        <Text style={[styles.empty, themeStyles.fontColorSub]}>{
                            this.props.selectedTab === 'onSale' ?
                                'This NFT is not on sale'
                                : 'All your NFTs are on sale'}
                        </Text>
                    </ScrollView> :
                    <>
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                onPress={this.handleSelectAllAuctions}
                                activeOpacity={0.8}
                                style={styles.leftRow}>
                                {
                                    (this.state.areAllAuctionsSelected && this.state.selectedAuctions.length === this.state.auctions.length) ||
                                        (!this.state.areAllAuctionsSelected && this.state.selectedAuctions.length === this.state.auctions.length) ?
                                        <MaterialCommunityIcons name="checkbox-marked" size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} /> :
                                        <MaterialCommunityIcons name="checkbox-blank-outline" size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} />
                                }
                                <Text style={[themeStyles.fontColorMain, styles.serialNumber]}>Select All</Text>
                            </TouchableOpacity>
                            <Text>Last Price</Text>
                        </View>
                        <FlatList
                            keyExtractor={keyExtractor}
                            renderItem={({ item }) => renderItem(item)}
                            refreshControl={renderRefresh}
                            data={this.state.auctions}
                            ListFooterComponent={renderFooter}
                        />
                        <Modal
                            animationIn={'slideInUp'}
                            animationOut={'slideOutDown'}
                            swipeDirection='down'
                            animationInTiming={400}
                            animationOutTiming={400}
                            onSwipeComplete={() => this.toggleAuctionPriceModal(false)}
                            onBackdropPress={() => this.toggleAuctionPriceModal(false)}
                            onBackButtonPress={() => this.toggleAuctionPriceModal(false)}
                            isVisible={this.state.isAuctionPriceModalVisible}
                            style={styles.modal}>
                            <KeyboardAvoidingView
                                behavior={behavior}
                                keyboardVerticalOffset={keyboardVerticalOffset}
                                style={[styles.subContainer, themeStyles.modalBackgroundColor]}
                            >
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => Keyboard.dismiss()}
                                >
                                    <View style={styles.modalHeaderRow}>
                                        <View style={styles.midTitleContainer}>
                                            <Text style={[styles.headerTitle, themeStyles.fontColorMain]}>Create an Auction</Text>
                                            <View style={[styles.titleBorder, themeStyles.borderColor]} />
                                        </View>
                                        <TouchableOpacity onPress={() => this.toggleAuctionPriceModal(false)}>
                                            <AntDesign name="close" size={21} color={themeStyles.fontColorMain.color} />
                                        </TouchableOpacity>
                                    </View>
                                    <View >
                                        <Text style={[styles.label, themeStyles.fontColorSub]}>Minimum price (Optional)</Text>
                                        <View style={styles.currencyRow}>
                                            <Text style={[{ paddingRight: 4 }, themeStyles.fontColorMain]}>Currency: </Text>
                                            <View style={{ flexDirection: 'row' }}>
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={this.toggleCurrencyTransfer}
                                                    style={
                                                        [
                                                            styles.currencyButton,
                                                            themeStyles.verificationBadgeBackgroundColor,
                                                            themeStyles.lightBorderColor
                                                        ]
                                                    }>
                                                    <Text style={styles.currency}>{currencyLabel}</Text>
                                                </TouchableOpacity>
                                                <TextInput
                                                    maxLength={8}
                                                    keyboardType='numeric'
                                                    style={
                                                        [
                                                            styles.input,
                                                            { borderColor: themeStyles.currencyButtonBackgroundColor.backgroundColor },
                                                            themeStyles.fontColorSub
                                                        ]
                                                    }
                                                    value={this.state.isUsd ? this.state.usd : this.state.clout}
                                                    onChangeText={(input) => this.state.isUsd ? this.setUsdAmount(input) : this.setCloutAmount(input)}
                                                    keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                    <CloutFeedButton
                                        backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                        isLoading={this.state.isModalButtonLoading}
                                        styles={styles.putOnSaleButtonContainer}
                                        title={'Put on sale'}
                                        onPress={this.handleOwnAuctionAlert}
                                    />
                                </TouchableOpacity>
                            </KeyboardAvoidingView>
                        </Modal>
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
        modal: {
            margin: 0,
            justifyContent: 'flex-end'
        },
        subContainer: {
            borderTopStartRadius: 10,
            borderTopEndRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 10
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 10,
        },
        modalHeaderRow: {
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        rowContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            paddingVertical: 25,
            paddingHorizontal: 10,
        },
        midTitleContainer: {
            position: 'absolute',
            right: 0,
            left: 0,
            top: -3,
            justifyContent: 'center',
            alignItems: 'center',
            borderColor: 'red',
        },
        headerTitle: {
            fontSize: 20,
        },
        titleBorder: {
            width: '100%',
            borderWidth: 1,
            borderRadius: 2,
            marginBottom: 15,
            marginTop: 4,
            alignSelf: 'center'
        },
        input: {
            borderWidth: 1,
            height: 30,
            width: 55,
            fontSize: 12,
            textAlign: 'center',
            marginHorizontal: 4,
            borderRadius: 3
        },
        serialNumber: {
            marginLeft: 4
        },
        leftRow: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        closeBidButton: {
            width: 250,
            height: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginVertical: 50,
            alignSelf: 'center'
        },
        closeBid: {
            fontWeight: '600',
            color: 'white',
            fontSize: 15
        },
        empty: {
            fontSize: 16,
            textAlign: 'center',
            margin: 20
        },
        label: {
            fontSize: 16,
            textAlign: 'center',
            marginTop: 15
        },
        currencyRow: {
            marginVertical: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        currencyButton: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            height: 28,
            borderWidth: 1,
            borderRadius: 4,
        },
        currency: {
            fontSize: 12,
            color: 'white'
        },
        putOnSaleButtonContainer: {
            width: 120,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginTop: 10,
            marginBottom: 30,
            alignSelf: 'center'
        },
    }
);
