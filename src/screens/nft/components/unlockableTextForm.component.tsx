import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, View, Platform, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { AntDesign } from '@expo/vector-icons';
import { Post } from '@types';
import { api } from '@services';
import { globals } from '@globals/globals';
import { signing } from '@services/authorization/signing';
import { nftApi } from '@services';

interface Props {
    toggleModal: (isVisible: boolean) => void;
    selectedNftForSale: Post;
    postHashHex: string;
    refresh: (isLoading: boolean) => void;
}

interface State {
    unlockableText: string;
    isButtonLoading: boolean;
    isVisible: boolean
}

export default class UnlockableTextFormComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            unlockableText: '',
            isButtonLoading: false,
            isVisible: true
        };

        this.close = this.close.bind(this);
        this.setUnlockableText = this.setUnlockableText.bind(this);
        this.handleSellNftBidAlert = this.handleSellNftBidAlert.bind(this);
        this.handleSellSingleNftBid = this.handleSellSingleNftBid.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private setUnlockableText(unlockableText: string): void {
        if (this._isMounted) {
            this.setState({ unlockableText });
        }
    }

    private close(p_animated = true): void {
        if (this._isMounted && p_animated) {
            this.setState({ isVisible: false });
        }

        const timeout = p_animated ? 1000 : 0;
        setTimeout(() => this.props.toggleModal(false), timeout);
    }

    private async handleSellSingleNftBid(): Promise<void> {
        if (this._isMounted) {
            this.setState({ isButtonLoading: true });
        }
        try {
            const encryptedUnlockableText = await signing.encryptShared(
                this.props.selectedNftForSale.ProfileEntryResponse?.PublicKeyBase58Check,
                this.state.unlockableText
            );
            const transactionResponse = await nftApi.sellNft(
                this.props.selectedNftForSale.BidAmountNanos,
                this.props.selectedNftForSale.ProfileEntryResponse?.PublicKeyBase58Check,
                encryptedUnlockableText,
                this.props.postHashHex,
                this.props.selectedNftForSale.SerialNumber,
                globals.user.publicKey
            );
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);

            Alert.alert(
                'Success!',
                'You sold your NFT successfully',
                [
                    {
                        text: 'Ok',
                        onPress: () => {
                            Keyboard.dismiss();
                            this.close(false);
                            this.props.refresh(true);
                        }
                    },
                ]
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isButtonLoading: false });
            }
        }
    }

    private handleSellNftBidAlert(): void {
        Alert.alert(
            'Sell NFT',
            'Are you sure you want to sell the selected NFT?',
            [
                {
                    text: 'Yes',
                    onPress: this.handleSellSingleNftBid
                },
                {
                    text: 'No',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    render() {

        const keyboardVerticalOffset = Platform.OS === 'ios' ? 10 : 0;
        const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

        return <Modal
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            swipeDirection='down'
            animationInTiming={400}
            animationOutTiming={400}
            onSwipeComplete={() => this.close()}
            onBackdropPress={() => this.close()}
            onBackButtonPress={() => this.close()}
            isVisible={this.state.isVisible}
            style={styles.modal}>
            <KeyboardAvoidingView
                behavior={behavior}
                keyboardVerticalOffset={keyboardVerticalOffset}
                style={[themeStyles.modalBackgroundColor, styles.subContainer]}
            >
                <TouchableOpacity activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                    <View style={styles.headerRow}>
                        <View style={styles.midTitleContainer}>
                            <Text style={[styles.headerTitle, themeStyles.fontColorMain]}>Unlockable Content</Text>
                            <View style={[styles.titleBorder, themeStyles.borderColor]} />
                        </View>
                        <TouchableOpacity onPress={() => this.close()}>
                            <AntDesign name="close" size={21} color={themeStyles.fontColorMain.color} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[themeStyles.fontColorSub, styles.unlockableTextLabel]}>
                        This NFT includes unlockable content. Enter it below.
                    </Text>
                    <TextInput
                        textAlignVertical='top'
                        placeholder='Enter URL, Code to redeem, link, etc..'
                        placeholderTextColor={themeStyles.fontColorSub.color}
                        value={this.state.unlockableText}
                        onChangeText={this.setUnlockableText}
                        multiline={true}
                        numberOfLines={Platform.OS === 'ios' ? 0 : 3}
                        style=
                        {
                            [
                                styles.input,
                                themeStyles.fontColorMain,
                                { borderColor: themeStyles.fontColorSub.color },
                                Platform.OS === 'ios' && { paddingBottom: 40 }
                            ]
                        }
                    />
                    <TouchableOpacity
                        onPress={this.handleSellNftBidAlert}
                        activeOpacity={1}
                        style={[styles.nftButtonContainer, themeStyles.verificationBadgeBackgroundColor]}>
                        {
                            this.state.isButtonLoading ?
                                <ActivityIndicator color={'white'} /> :
                                <Text style={styles.nftButtonText}>Sell NFT</Text>
                        }
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>;
    }
}

const styles = StyleSheet.create(
    {
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        subContainer: {
            borderTopStartRadius: 10,
            borderTopEndRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 10
        },
        headerRow: {
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
            fontSize: 20
        },
        titleBorder: {
            width: '100%',
            borderWidth: 1,
            borderRadius: 2,
            marginBottom: 15,
            marginTop: 4,
            alignSelf: 'center'
        },
        unlockableTextLabel: {
            paddingVertical: 20
        },
        input: {
            borderWidth: 1,
            marginBottom: 15,
            borderRadius: 3,
            padding: 10,
        },
        nftButtonContainer: {
            width: 100,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginTop: 10,
            marginBottom: 40,
            alignSelf: 'center'
        },
        nftButtonText: {
            fontWeight: '600',
            color: 'white',
            fontSize: 13
        }
    }
);
