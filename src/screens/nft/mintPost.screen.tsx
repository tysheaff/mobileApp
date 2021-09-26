import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globals } from '@globals/globals';
import { settingsGlobals } from '@globals/settingsGlobals';
import { api, calculateAndFormatBitCloutInUsd, nftApi } from '@services';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { signing } from '@services/authorization/signing';
import { StackNavigationProp } from '@react-navigation/stack';

type RouteParams = {
    mint: {
        postHashHex: string;
    },
};

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'mint'>;
}

enum NftType {
    Single = 'Single',
    Multiple = 'Multiple'
}

interface State {
    selectedNftType: string;
    nftCopiesCount: string;
    isForSale: boolean;
    hasUnlockableContent: boolean;
    isUsd: boolean;
    clout: string;
    usd: string;
    creatorRoyaltyPercentage: string;
    coinHolderRoyaltyPercentage: string;
    isMintButtonEnabled: boolean;
    networkFee: number;
}

export default class MintPostScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedNftType: NftType.Single,
            nftCopiesCount: '1',
            isForSale: true,
            hasUnlockableContent: false,
            clout: '0',
            usd: '0',
            isUsd: false,
            creatorRoyaltyPercentage: '5',
            coinHolderRoyaltyPercentage: '10',
            isMintButtonEnabled: false,
            networkFee: 0.00001
        };

        this.handleNftCount = this.handleNftCount.bind(this);
        this.toggleCurrencyTransfer = this.toggleCurrencyTransfer.bind(this);
        this.toggleUnlockableContent = this.toggleUnlockableContent.bind(this);
        this.toggleAuctionSale = this.toggleAuctionSale.bind(this);
        this.setUsdAmount = this.setUsdAmount.bind(this);
        this.setCloutAmount = this.setCloutAmount.bind(this);
        this.handleRoyaltyPercentages = this.handleRoyaltyPercentages.bind(this);
        this.mintPost = this.mintPost.bind(this);
        this.goBack = this.goBack.bind(this);
        this.handleControlChange = this.handleControlChange.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private handleNftCount(count: string): void {
        const parsedCount = Number(count);
        if (parsedCount > 1000) {
            return;
        }
        const networkFee = Number((parsedCount * 0.00001).toFixed(5));

        if (this._isMounted) {
            if (!isNaN(Number(count))) {
                this.setState(
                    {
                        nftCopiesCount: count.replace(/\D/g, ''),
                        networkFee
                    }
                );
            }
        }
    }

    private handleNftType(selectedNftType: string): void {
        if (this._isMounted) {
            if (selectedNftType === NftType.Single) {
                this.setState({ nftCopiesCount: '1' });
            }
            this.setState({ selectedNftType });
        }
    }

    private toggleAuctionSale(): void {
        const newValue = !this.state.isForSale;
        if (this._isMounted) {
            this.setState({ isForSale: newValue });
        }
    }

    private toggleUnlockableContent(): void {
        const newValue = !this.state.hasUnlockableContent;
        if (this._isMounted) {
            this.setState({ hasUnlockableContent: newValue });
        }
    }

    private toggleCurrencyTransfer(): void {
        if (this._isMounted) {
            this.setState({ isUsd: !this.state.isUsd });
        }
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

    private handleRoyaltyPercentages(percentage: string, isCreator: boolean): void {
        const parsedPercentage = Number(percentage.split(',').join('.'));
        if ((this._isMounted && !isNaN(parsedPercentage)) && (parsedPercentage >= 0 && parsedPercentage <= 100)) {
            if (isCreator) {
                this.setState({ creatorRoyaltyPercentage: percentage });
            } else {
                this.setState({ coinHolderRoyaltyPercentage: percentage });
            }
        }
    }

    private goBack(): void {
        if (this._isMounted) {
            this.props.navigation.goBack();
        }
    }

    private isFormValid(): boolean {
        if (Number(this.state.creatorRoyaltyPercentage) + Number(this.state.coinHolderRoyaltyPercentage) > 100) {
            Alert.alert('Error', 'The sum of creator and coin-holder royalties must be less than 100.');
            return false;
        }

        if (this.state.selectedNftType === NftType.Multiple && Number(this.state.nftCopiesCount) < 2) {
            Alert.alert('Error', 'The number of NFT copies for multiple type should be greater than 1.');
            return false;
        }

        if (Number(this.state.nftCopiesCount) > 1000) {
            Alert.alert('Error', 'The number of NFT copies must be between 1 and 1000.');
            return false;
        }
        return true;
    }

    private async mintPost(): Promise<void> {
        if (!this.isFormValid()) {
            return;
        }

        const bidAmountNanos = Number(this.state.clout.split(',').join('.')) * 1000000000;
        try {
            if (this._isMounted) {
                this.setState({ isMintButtonEnabled: true });
            }
            const transactionResponse = await nftApi.mintPost(
                this.state.hasUnlockableContent,
                this.state.isForSale,
                bidAmountNanos,
                this.props.route.params.postHashHex,
                Number(this.state.coinHolderRoyaltyPercentage.split(',').join('.')) * 100,
                Number(this.state.creatorRoyaltyPercentage.split(',').join('.')) * 100,
                Number(this.state.nftCopiesCount),
                globals.user.publicKey
            );
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);

            Alert.alert(
                'Success!',
                'Your post was minted successfully',
                [
                    {
                        text: 'Ok',
                        onPress: this.goBack
                    },
                ]
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isMintButtonEnabled: false });
            }
        }
    }

    private handleControlChange(increase: boolean): void {
        const parsedNumCopies = Number(this.state.nftCopiesCount);
        let networkFee;
        if (this.state.selectedNftType === NftType.Single ||
            (parsedNumCopies <= 1 && !increase) ||
            (parsedNumCopies > 1000 && increase)
        ) {
            return;
        }
        if (this._isMounted) {
            if (increase) {
                networkFee = Number((this.state.networkFee + 0.00001).toFixed(5));
                this.setState(
                    {
                        nftCopiesCount: String(parsedNumCopies + 1),
                        networkFee
                    }
                );
            } else {
                networkFee = Number((this.state.networkFee - 0.00001).toFixed(5));
                this.setState(
                    {
                        nftCopiesCount: String(parsedNumCopies - 1),
                        networkFee
                    }
                );
            }
        }
    }

    render(): JSX.Element {

        const currency = this.state.isUsd ? 'USD' : 'DESO';
        const radioButtonSingleName = this.state.selectedNftType === NftType.Single ? 'radio-button-on' : 'radio-button-off';
        const radioButtonMultipleName = this.state.selectedNftType === NftType.Multiple ? 'radio-button-on' : 'radio-button-off';
        const areMultipleCopiesEnabled = this.state.selectedNftType === NftType.Multiple;

        return <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingVertical: 10 }}
            style={[styles.container, themeStyles.containerColorMain]}
        >
            <View style={[styles.subContainer, themeStyles.containerColorMain]}>
                <Text style={[styles.title, themeStyles.fontColorSub]}>Type of NFT</Text>
                <View style={[{ backgroundColor: themeStyles.recloutBorderColor.borderColor }, styles.titleBorder]} />
                <View style={styles.choices}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.choiceRow}
                        onPress={() => this.handleNftType(NftType.Single)}
                    >
                        <Ionicons style={styles.radioButtinIcon} name={radioButtonSingleName} size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} />
                        <Text style={[styles.label, themeStyles.fontColorMain]}>Single</Text>
                    </TouchableOpacity>
                    <View style={styles.row}>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => this.handleNftType(NftType.Multiple)}
                            style={styles.choiceRow}
                        >
                            <Ionicons style={styles.radioButtinIcon} name={radioButtonMultipleName} size={15} color={themeStyles.verificationBadgeBackgroundColor.backgroundColor} />
                            <Text style={[styles.label, themeStyles.fontColorMain]}>Multiple</Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => this.handleControlChange(false)}
                                style={styles.decreaseControl}
                            >
                                <Text style={styles.decrease}>-</Text>
                            </TouchableOpacity>
                            <TextInput
                                editable={areMultipleCopiesEnabled}
                                maxLength={3}
                                style={
                                    [
                                        styles.input,
                                        themeStyles.borderColor,
                                        themeStyles.fontColorSub,
                                        !areMultipleCopiesEnabled &&
                                        themeStyles.modalBackgroundColor,
                                        { marginHorizontal: 5 }
                                    ]
                                }
                                value={this.state.nftCopiesCount}
                                keyboardType='numeric'
                                onChangeText={this.handleNftCount}
                                keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                            />
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => this.handleControlChange(true)}
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
                </View>
                <Text style={[themeStyles.fontColorSub, styles.hint]}>An NFT can have multiple editions, each with its own unique serial number</Text>
                <Text style={[styles.title, themeStyles.fontColorSub]}>Sale Status and Price</Text>
                <View style={[{ backgroundColor: themeStyles.recloutBorderColor.borderColor }, styles.titleBorder]} />

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>Put on Sale</Text>
                    <Switch
                        style={Platform.OS === 'ios' && styles.switchStyle}
                        trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                        thumbColor={'white'}
                        ios_backgroundColor={themeStyles.switchColor.color}
                        onValueChange={this.toggleAuctionSale}
                        value={this.state.isForSale}
                    />
                </View>

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>Minimum Bid</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        <TextInput
                            maxLength={8}
                            keyboardType='numeric'
                            style={[styles.input, { borderColor: themeStyles.currencyButtonBackgroundColor.backgroundColor }, themeStyles.fontColorSub]}
                            value={this.state.isUsd ? this.state.usd : this.state.clout}
                            onChangeText={(input) => this.state.isUsd ? this.setUsdAmount(input) : this.setCloutAmount(input)}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                </View>

                <Text style={[styles.title, themeStyles.fontColorSub]}>Royalties</Text>
                <View style={[{ backgroundColor: themeStyles.recloutBorderColor.borderColor }, styles.titleBorder]} />

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>% Creator Royalty</Text>
                    <TextInput
                        maxLength={4}
                        keyboardType='numeric'
                        style={[styles.input, { borderColor: themeStyles.currencyButtonBackgroundColor.backgroundColor }, themeStyles.fontColorSub]}
                        value={this.state.creatorRoyaltyPercentage}
                        onChangeText={(input) => this.handleRoyaltyPercentages(input, true)}
                        keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                    />
                </View>

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>% Coin-holder Royalty</Text>
                    <TextInput
                        maxLength={4}
                        keyboardType='numeric'
                        style={[styles.input, { borderColor: themeStyles.currencyButtonBackgroundColor.backgroundColor }, themeStyles.fontColorSub]}
                        value={this.state.coinHolderRoyaltyPercentage}
                        onChangeText={(input) => this.handleRoyaltyPercentages(input, false)}
                        keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                    />
                </View>

                <Text style={[styles.hint, themeStyles.fontColorSub]}>On every sale, including resale, a customizable percentage goes to you, the creator, and to your coin-holders.</Text>
                <Text style={[styles.title, themeStyles.fontColorSub]}>Unlockable Content</Text>
                <View style={[{ backgroundColor: themeStyles.recloutBorderColor.borderColor }, styles.titleBorder]} />

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>Enable Unlockable Content</Text>
                    <Switch
                        style={Platform.OS === 'ios' && styles.switchStyle}
                        trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                        thumbColor={'white'}
                        ios_backgroundColor={themeStyles.switchColor.color}
                        onValueChange={this.toggleUnlockableContent}
                        value={this.state.hasUnlockableContent}
                    />
                </View>
                <Text style={[styles.hint, themeStyles.fontColorSub]}>Include exclusive text, like a URL, encrypted for NFT purchasers.</Text>

                <View style={styles.row}>
                    <Text style={[styles.label, themeStyles.fontColorMain]}>Network Fee</Text>
                    <Text style={themeStyles.fontColorSub}>{this.state.networkFee} DESO (~${calculateAndFormatBitCloutInUsd(this.state.networkFee)})</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={1}
                    disabled={this.state.isMintButtonEnabled}
                    onPress={this.mintPost}
                    style={[styles.mintPostButton, themeStyles.verificationBadgeBackgroundColor]}
                >
                    {
                        this.state.isMintButtonEnabled ?
                            <ActivityIndicator color='white' /> :
                            <Text style={styles.mintPost}>Mint NFT</Text>
                    }
                </TouchableOpacity>
            </View>
        </ScrollView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        subContainer: {
            flex: 1,
            paddingHorizontal: 10,
        },
        titleBorder: {
            width: '100%',
            height: .5,
            marginVertical: 5,
            alignSelf: 'center'
        },
        title: {
            fontSize: 15,
            fontWeight: '600',
            textAlign: 'center',
            marginTop: 3
        },
        choices: {
            marginVertical: 10
        },
        choiceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 5
        },
        label: {
            fontSize: 15,
            fontWeight: '600',
        },
        radioButtinIcon: {
            marginRight: 5
        },
        switchStyle: {
            transform: [{ scaleX: .7 }, { scaleY: .7 }]
        },
        input: {
            borderWidth: 1,
            height: 25,
            width: 60,
            textAlign: 'center',
            fontSize: 12,
            borderRadius: 3,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: 5
        },
        currencyButton: {
            justifyContent: 'center',
            alignItems: 'center',
            width: 55,
            height: 25,
            borderWidth: 1,
            borderRadius: 4,
            marginRight: 5,
        },
        currency: {
            fontSize: 12,
            color: 'white'
        },
        mintPostButton: {
            width: 100,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
            borderRadius: 4,
            marginVertical: 10,
        },
        mintPost: {
            color: 'white',
            fontWeight: '600'
        },
        increaseControl: {
            borderWidth: 1,
            height: 25,
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
            height: 25,
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
        hint: {
            marginVertical: 10,
            fontSize: 13
        }
    }
);
