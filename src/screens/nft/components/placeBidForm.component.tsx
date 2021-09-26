import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Keyboard, Alert, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { eventManager } from '@globals/injector';
import { BidEdition, EventType, Post } from '@types';
import { AntDesign } from '@expo/vector-icons';
import { themeStyles } from '@styles/globalColors';
import { formatNumber } from '@services/helpers';
import { calculateAndFormatBitCloutInUsd, calculateBitCloutInUSD } from '@services/bitCloutCalculator';
import { globals } from '@globals/globals';
import { api, cache, nftApi } from '@services';
import { signing } from '@services/authorization/signing';
import { settingsGlobals } from '@globals/settingsGlobals';

interface Props {
    post: Post;
    bidEdition: BidEdition;
}

interface State {
    isLoading: boolean;
    isBiddingButtonLoading: boolean;
    usd: string;
    clout: string;
    isUsd: boolean;
    highestBid: number;
    lowestBid: number;
    isFormVisible: boolean;
    ownUserBalance: number;
}

export default class PlaceBidFormComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isBiddingButtonLoading: false,
            usd: '0',
            clout: '0',
            isUsd: false,
            highestBid: this.props.bidEdition.HighestBidAmountNanos,
            lowestBid: this.props.bidEdition.LowestBidAmountNanos,
            isFormVisible: true,
            ownUserBalance: 0
        };

        this.init = this.init.bind(this);
        this.close = this.close.bind(this);
        this.setCloutAmount = this.setCloutAmount.bind(this);
        this.setUsdAmount = this.setUsdAmount.bind(this);
        this.toggleCurrencyTransfer = this.toggleCurrencyTransfer.bind(this);
        this.placeBid = this.placeBid.bind(this);

        this.init();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async init(): Promise<void> {
        try {
            const responses = await Promise.all(
                [
                    cache.exchangeRate.getData(),
                    cache.user.getData()
                ]
            );
            if (this._isMounted) {
                this.setState({ ownUserBalance: responses[1].BalanceNanos, isLoading: false });
            }
        } catch { return; }
    }

    private close(): void {
        if (this._isMounted) {
            this.setState({ isFormVisible: false });
        }
        setTimeout(() => eventManager.dispatchEvent(EventType.ToggleBidForm, { visible: false }), 500);
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

    private handleUsdControlChange(increase: boolean): void {
        const parsedUsd = Number(this.state.usd.split(',').join('.'));
        if ((parsedUsd > 0 && parsedUsd < 1 || parsedUsd <= 0) && !increase) {
            return;
        }
        if (this._isMounted && !isNaN(parsedUsd)) {
            if (increase) {
                this.setState(
                    (prevState) => (
                        {
                            usd: (parsedUsd + 1).toFixed(2),
                            clout: (Number(prevState.clout.split(',').join('.')) + (100 / globals.exchangeRate.USDCentsPerBitCloutExchangeRate)).toFixed(4)
                        }
                    )
                );
            } else {
                this.setState(
                    (prevState) => (
                        {
                            usd: (parsedUsd - 1).toFixed(2),
                            clout: (Number(prevState.clout.split(',').join('.')) - (100 / globals.exchangeRate.USDCentsPerBitCloutExchangeRate)).toFixed(4)
                        }
                    )
                );
            }
        }
    }

    private handleCloutControlChange(increase: boolean): void {
        const parsedClout = Number(this.state.clout.split(',').join('.'));
        if ((parsedClout > 0 && parsedClout < 1 || parsedClout <= 0) && !increase) {
            return;
        }

        if (this._isMounted && !isNaN(parsedClout)) {
            if (increase) {
                this.setState(
                    (prevState) => (
                        {
                            clout: String((parsedClout + 1).toFixed(2)),
                            usd: (Number(prevState.usd.split(',').join('.')) + (globals.exchangeRate.USDCentsPerBitCloutExchangeRate / 100)).toFixed(2)
                        }
                    )
                );
            } else {
                this.setState(
                    (prevState) => (
                        {
                            clout: String((parsedClout - 1).toFixed(2)),
                            usd: (Number(prevState.usd.split(',').join('.')) - (globals.exchangeRate.USDCentsPerBitCloutExchangeRate / 100)).toFixed(2)
                        }
                    )
                );

            }
        }
    }

    private isBidFormValid(bidAmountNanos: number): boolean {

        const minBidAmountInUsd = formatNumber(calculateBitCloutInUSD(this.props.bidEdition.MinBidAmountNanos), true);
        const minBidAmountInClout = formatNumber(this.props.bidEdition.MinBidAmountNanos / 1000000000, true, 4);

        if (this.state.clout.length === 0 || this.state.usd.length === 0) {
            Alert.alert('Error', 'Bid amount is empty');
            return false;
        }
        if (bidAmountNanos === 0) {
            Alert.alert('Error', 'Bid amount should be greater than 0');
            return false;
        }
        if (bidAmountNanos > this.state.ownUserBalance) {
            Alert.alert('Unable to place bid', 'Your balance is not enough to complete this bid');
            return false;
        }

        if (bidAmountNanos < this.props.bidEdition.MinBidAmountNanos) {
            Alert.alert('Unable to place bid', `Your bid of ${this.state.clout}($${this.state.usd}) does not meet the minimum requirement of ${minBidAmountInClout}($${minBidAmountInUsd})`);
            return false;
        }
        return true;
    }

    private async placeBid(): Promise<void> {
        const bidAmountNanos = parseInt((Number(this.state.clout.split(',').join('.')) * 1000000000).toFixed(0));

        if (!this.isBidFormValid(bidAmountNanos)) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isBiddingButtonLoading: true });
        }
        Keyboard.dismiss();

        const postHashHex: string = this.props.post.PostHashHex;
        try {
            const transactionResponse = await nftApi.placeNftBid(bidAmountNanos, postHashHex, this.props.bidEdition.SerialNumber, globals.user.publicKey);
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);
            Alert.alert(
                'Bid placed!',
                'Your bid was successful. We will notify you when the auction closes.',
                [
                    {
                        text: 'Ok',
                        onPress: this.close
                    },
                ]
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isBiddingButtonLoading: false });
            }
        }
    }

    private toggleCurrencyTransfer(): void {
        if (this._isMounted) {
            this.setState({ isUsd: !this.state.isUsd });
        }
    }

    render(): JSX.Element {

        const highestBid = this.state.isUsd ?
            <>~${calculateAndFormatBitCloutInUsd(this.state.highestBid)} </> :
            formatNumber(this.state.highestBid / 1000000000, true, 3);

        const lowestBid = this.state.isUsd ?
            <>~${calculateAndFormatBitCloutInUsd(this.state.lowestBid)} </> :
            formatNumber(this.state.lowestBid / 1000000000, true, 3);

        const keyboardVerticalOffset = Platform.OS === 'ios' ? 10 : 0;
        const behavior = Platform.OS === 'ios' ? 'padding' : undefined;
        const currency = this.state.isUsd ? 'USD' : 'DESO';

        return <Modal
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            swipeDirection='down'
            animationInTiming={400}
            animationOutTiming={400}
            onSwipeComplete={this.close}
            onBackdropPress={this.close}
            onBackButtonPress={this.close}
            isVisible={this.state.isFormVisible}
            style={styles.modal}>
            <KeyboardAvoidingView
                behavior={behavior}
                keyboardVerticalOffset={keyboardVerticalOffset}
                style={[themeStyles.modalBackgroundColor, styles.container]}
            >
                {
                    this.state.isLoading ?
                        <View style={{ height: '30%', paddingTop: 50 }}>
                            <ActivityIndicator
                                color={themeStyles.fontColorMain.color}
                            />
                        </View> :
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => Keyboard.dismiss()}
                        >
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, themeStyles.fontColorMain]}>Place a bid</Text>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={this.close}
                                >
                                    <AntDesign name="close" size={21} color={themeStyles.fontColorMain.color} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[themeStyles.fontColorSub, styles.subtitle]}>You are about to place a bid for an NFT auctioned by
                                <Text style={styles.username}> @{this.props.post.ProfileEntryResponse.Username}</Text>
                            </Text>
                            <View style={styles.serialNumberRow}>
                                <Text style={[styles.serialNumber, themeStyles.fontColorMain]}>Serial Number #{this.props.bidEdition.SerialNumber}</Text>
                                <View style={styles.currencyRow}>
                                    <Text style={[themeStyles.fontColorMain, styles.currencyButtonLabel]}>Currency: </Text>
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
                                        <Text style={styles.currency}>{currency}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[themeStyles.modalBackgroundColor, styles.serialNumberBorder]} />
                            <View style={styles.priceRow}>
                                <Text style={[themeStyles.fontColorMain, styles.rowTitle]}>Highest bid </Text>
                                <View style={[styles.box, themeStyles.currencyButtonBackgroundColor]}>
                                    <Text style={[themeStyles.fontColorSub, styles.rowCoinValue]}>{highestBid}</Text>
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={[themeStyles.fontColorMain, styles.rowTitle]}>From</Text>
                                <View style={[styles.box, themeStyles.currencyButtonBackgroundColor]}>
                                    <Text style={[themeStyles.fontColorSub, styles.rowCoinValue]}>{lowestBid}</Text>
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={[themeStyles.fontColorMain, styles.rowTitle]}>Creator Royalty bid </Text>
                                <View style={[styles.box, themeStyles.currencyButtonBackgroundColor]}>
                                    <Text style={[themeStyles.fontColorSub, styles.rowCoinValue]}>
                                        {this.props.post.NFTRoyaltyToCreatorBasisPoints / 100}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={[themeStyles.fontColorMain, styles.rowTitle]}>Coin-holder Royalty</Text>
                                <View style={[styles.box, themeStyles.currencyButtonBackgroundColor]}>
                                    <Text style={[themeStyles.fontColorSub, styles.rowCoinValue]}>{this.props.post.NFTRoyaltyToCoinBasisPoints / 100}%</Text>
                                </View>
                            </View>

                            <View style={{ marginVertical: 10 }} >
                                <Text style={[styles.serialNumber, themeStyles.fontColorSub]}>Your Bid</Text>
                                <View style={[{ backgroundColor: themeStyles.fontColorSub.color }, styles.serialNumberBorder]} />
                                <View style={styles.currencyInputContainer}>
                                    <Text style={themeStyles.fontColorSub}>{currency}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity
                                            onPress={() => this.state.isUsd ? this.handleUsdControlChange(false) : this.handleCloutControlChange(false)}
                                            activeOpacity={0.7}
                                            style={styles.decreaseControl}
                                        >
                                            <Text style={styles.decrease}>-</Text>
                                        </TouchableOpacity>
                                        <TextInput
                                            maxLength={8}
                                            keyboardType='numeric'
                                            style={[styles.input, { borderColor: themeStyles.currencyButtonBackgroundColor.backgroundColor }, themeStyles.fontColorSub]}
                                            value={this.state.isUsd ? this.state.usd : this.state.clout}
                                            onChangeText={(input) => this.state.isUsd ? this.setUsdAmount(input) : this.setCloutAmount(input)}
                                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                                        />
                                        <TouchableOpacity
                                            onPress={() => this.state.isUsd ? this.handleUsdControlChange(true) : this.handleCloutControlChange(true)}
                                            activeOpacity={0.7}
                                            style={
                                                [
                                                    styles.increaseControl,
                                                    { borderColor: themeStyles.verificationBadgeBackgroundColor.backgroundColor }
                                                ]
                                            }
                                        >
                                            <Text style={[styles.increase, { color: themeStyles.verificationBadgeBackgroundColor.backgroundColor }]}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.buttonsContainer}>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        disabled={this.state.isBiddingButtonLoading}
                                        onPress={this.placeBid}
                                        style={[styles.placeBidButton, themeStyles.verificationBadgeBackgroundColor]}
                                    >
                                        {
                                            this.state.isBiddingButtonLoading ?
                                                <ActivityIndicator color='white' /> :
                                                <Text style={styles.placeBid}>Place Bid</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                }
            </KeyboardAvoidingView>

        </Modal>;
    }
}

const styles = StyleSheet.create(
    {
        modal: {
            margin: 0,
            justifyContent: 'flex-end'
        },
        container: {
            paddingHorizontal: 10,
            borderTopStartRadius: 10,
            borderTopEndRadius: 10,
            paddingTop: 20,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        username: {
            fontWeight: 'bold'
        },
        title: {
            fontSize: 16,
        },
        subtitle: {
            fontSize: 15,
            paddingVertical: 10,
        },
        serialNumberRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        currencyButtonLabel: {
            paddingRight: 2,
        },
        serialNumber: {
            fontSize: 15,
            fontWeight: '600',
            textAlign: 'center'
        },
        serialNumberBorder: {
            width: '100%',
            height: 1,
            marginVertical: 10,
            alignSelf: 'center'
        },
        currencyRow: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        priceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 3,
        },
        rowTitle: {
            fontWeight: '600'
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
        box: {
            width: 70,
            height: 25,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
        },
        rowCoinValue: {
            fontSize: 12
        },
        currencyInputContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 5,
            alignItems: 'center',
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
        increaseControl: {
            borderWidth: 1,
            height: 30,
            width: 35,
            fontSize: 14,
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 2,
        },
        increase: {
            color: '#007bff',
            fontSize: 16,
        },
        decreaseControl: {
            borderWidth: 1,
            borderColor: '#eb1b0c',
            height: 30,
            width: 35,
            fontSize: 14,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 2,
        },
        decrease: {
            color: '#eb1b0c',
            fontSize: 16,
        },
        buttonsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingVertical: 20,
        },
        placeBidButton: {
            width: 140,
            height: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginBottom: 20,
        },
        placeBid: {
            color: 'white',
            fontWeight: '600'
        },
    }
);
