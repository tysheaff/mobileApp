import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, TextInput, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { AntDesign } from '@expo/vector-icons';
import { themeStyles } from '@styles/globalColors';
import { settingsGlobals } from '@globals/settingsGlobals';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { globals } from '@globals/globals';
import { signing } from '@services/authorization/signing';
import { api, nftApi, snackbar } from '@services';
import { Post } from '@types';

interface Props {
    toggleModal: (isVisible: boolean) => void;
    isVisible: boolean;
    postHashHex: string;
    refresh: (isLoading?: boolean) => void;
    auctions: Post[];
    isSingleNFT?: boolean;
}

interface State {
    isVisible: boolean;
    isUsd: boolean;
    isButtonLoading: boolean;
    usd: string;
    clout: string;
}

export default class MinBidAmountFormComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isVisible: this.props.isVisible,
            isUsd: false,
            isButtonLoading: false,
            usd: '0',
            clout: '0',
        };

        this.setCloutAmount = this.setCloutAmount.bind(this);
        this.setUsdAmount = this.setUsdAmount.bind(this);
        this.toggleCurrencyTransfer = this.toggleCurrencyTransfer.bind(this);
        this.handleOpenOwnAuctionAlert = this.handleOpenOwnAuctionAlert.bind(this);
        this.handleOpenOwnAuction = this.handleOpenOwnAuction.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
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
            this.setState({ usd, clout });
        }
    }

    private toggleCurrencyTransfer(): void {
        if (this._isMounted) {
            this.setState({ isUsd: !this.state.isUsd });
        }
    }

    private async handleUpdateAuction(auction: Post): Promise<void> {
        const bidAmountNanos = Number(this.state.clout.split(',').join('.')) * 1000000000;

        const transactionResponse = await nftApi.updateNftBid(
            true,
            bidAmountNanos,
            this.props.postHashHex,
            auction.SerialNumber,
            globals.user.publicKey
        );
        const transactionHex: string = transactionResponse.TransactionHex;

        const signedTransactionHex = await signing.signTransaction(transactionHex);
        await api.submitTransaction(signedTransactionHex);
    }

    private async handleOpenOwnAuction(): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isButtonLoading: true, isVisible: true });
            }

            for (const auction of this.props.auctions) {
                await this.handleUpdateAuction(auction);
            }
            if (!this.props.isSingleNFT) {
                const text = 'Auction(s) opened successfully';
                snackbar.showSnackBar({ text });
            }
            setTimeout(() => {
                this.props.refresh(true);
                this.close();
            }, 500);
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isVisible: false, isButtonLoading: false });
            }
        }
    }

    private handleOpenOwnAuctionAlert(): void {
        const openTitleType = this.props.auctions.length === 1 ? 'Put on Sale' : 'Open Auctions';
        const title = openTitleType;
        const body = 'Are you sure you want to put the selected NFT(s) on sale?';

        Alert.alert(title, body,
            [
                {
                    text: 'Yes',
                    onPress: this.handleOpenOwnAuction
                },
                {
                    text: 'Cancel',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    private close(): void {
        if (this._isMounted) {
            this.setState({ isVisible: false });
        }
        this.props.toggleModal(false);
    }

    render() {

        const currencyLabel = this.state.isUsd ? 'USD' : 'CLOUT';
        const keyboardVerticalOffset = Platform.OS === 'ios' ? 10 : 0;
        const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

        return <Modal
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            swipeDirection='down'
            animationInTiming={400}
            animationOutTiming={400}
            onSwipeComplete={this.close}
            onBackdropPress={this.close}
            onBackButtonPress={this.close}
            isVisible={this.state.isVisible}
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
                        <TouchableOpacity onPress={this.close}>
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
                        isLoading={this.state.isButtonLoading}
                        styles={styles.putOnSaleButtonContainer}
                        title={'Put on Sale'}
                        onPress={this.handleOpenOwnAuctionAlert}
                    />
                </TouchableOpacity>
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
        subContainer: {
            borderTopStartRadius: 10,
            borderTopEndRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 10
        },
        modalHeaderRow: {
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
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
