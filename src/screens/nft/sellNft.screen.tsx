import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, FlatList, TextInput, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { AntDesign } from '@expo/vector-icons';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';
import { Post } from '@types';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { globals } from '@globals/globals';
import { api, nftApi } from '@services';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import CloutFeedButton from '@components/cloutfeedButton.component';

type RouteParams = {
    nft: {
        selectedNftsForSale: Post[];
        post: Post;
        hasUnlockableContent: boolean;
    }
};

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'nft'>;
}

interface State {
    isLoading: boolean;
    selectedNftsForSale: Post[];
    sellingPriceCloutNanos: number;
    earningsCloutNanos: number;
    creatorRoyaltyCloutNanos: number;
    coinHolderRoyaltyCloutNanos: number;
    unlockableText: string;
    isSellButtonLoading: boolean;
}

export default class SellNftScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            selectedNftsForSale: this.props.route.params.selectedNftsForSale,
            sellingPriceCloutNanos: 0,
            earningsCloutNanos: 0,
            creatorRoyaltyCloutNanos: 0,
            coinHolderRoyaltyCloutNanos: 0,
            unlockableText: '',
            isSellButtonLoading: false
        };

        this.init = this.init.bind(this);
        this.filterNfts = this.filterNfts.bind(this);
        this.setUnlockableText = this.setUnlockableText.bind(this);
        this.handleSellNftBid = this.handleSellNftBid.bind(this);
        this.isFormValid = this.isFormValid.bind(this);

    }

    componentDidMount(): void {
        this._isMounted = true;

        this.init();
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private init(): void {

        const sellingStats = this.calculateSellingStats(this.state.selectedNftsForSale);

        if (this._isMounted) {
            this.setState(
                {
                    ...sellingStats,
                    isLoading: false
                }
            );
        }
    }

    private calculateSellingStats(p_nftBids: Post[]) {
        let sellingPriceCloutNanos = 0;
        for (const nft of p_nftBids) {
            sellingPriceCloutNanos += nft.BidAmountNanos;
        }

        const creatorRoyaltyPercentage = this.props.route.params.post.NFTRoyaltyToCreatorBasisPoints / 10000;
        const coinHolderRoyaltyPercentage = this.props.route.params.post.NFTRoyaltyToCoinBasisPoints / 10000;

        const creatorRoyaltyCloutNanos = creatorRoyaltyPercentage * sellingPriceCloutNanos;
        const coinHolderRoyaltyCloutNanos = coinHolderRoyaltyPercentage * sellingPriceCloutNanos;
        const earningsCloutNanos = sellingPriceCloutNanos - creatorRoyaltyCloutNanos - coinHolderRoyaltyCloutNanos;

        return {
            sellingPriceCloutNanos,
            creatorRoyaltyCloutNanos,
            coinHolderRoyaltyCloutNanos,
            earningsCloutNanos
        };
    }

    private calculateBidderBalance(bidderBalanceNanos: number): string {
        const balance = bidderBalanceNanos / 1000000000;
        const formattedNumber = balance.toFixed(4);
        return formattedNumber;
    }

    private filterNfts(serialNumber: number): void {
        const filteredNfts = this.state.selectedNftsForSale.filter((item: Post) => item.SerialNumber !== serialNumber);

        if (filteredNfts.length > 0) {
            const sellingStats = this.calculateSellingStats(filteredNfts);

            if (this._isMounted) {
                this.setState({ ...sellingStats, selectedNftsForSale: filteredNfts });
            }
        } else {
            this.props.navigation.goBack();
        }
    }

    private setUnlockableText(text: string): void {
        if (this._isMounted) {
            this.setState({ unlockableText: text });
        }
    }

    private isFormValid(): boolean {
        const serialNumbers = this.state.selectedNftsForSale.map((item: Post) => item.SerialNumber);
        const isDuplicate = serialNumbers.some((item, idx) => serialNumbers.indexOf(item) != idx);
        if (isDuplicate) {
            Alert.alert('Error', 'You can sell an NFT for a single user only');
            return false;
        }
        return true;
    }

    private async handleSellNftBid(): Promise<void> {
        if (!this.isFormValid()) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isSellButtonLoading: true });
        }

        try {
            for (const nft of this.state.selectedNftsForSale) {
                const encryptedUnlockableText = await signing.encryptShared(
                    nft.ProfileEntryResponse?.PublicKeyBase58Check,
                    this.state.unlockableText
                );
                const transactionResponse = await nftApi.sellNft(
                    (nft as any).BidAmountNanos,
                    nft.ProfileEntryResponse?.PublicKeyBase58Check,
                    encryptedUnlockableText,
                    this.props.route.params.post.PostHashHex,
                    nft.SerialNumber,
                    globals.user.publicKey
                );
                const transactionHex: string = transactionResponse.TransactionHex;

                const signedTransactionHex = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransactionHex);
            }
            Alert.alert(
                'Success!',
                'You sold your NFT successfully',
                [
                    {
                        text: 'Ok',
                        onPress: () => this.props.navigation.goBack()
                    },
                ]
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isSellButtonLoading: false });
            }
        }
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const behavior = Platform.OS === 'ios' ? 'position' : undefined;

        const keyExtractor = (item: Post, index: number) => `${item.ProfileEntryResponse?.PublicKeyBase58Check}_${index.toString()}`;
        const renderItem = (item: Post): JSX.Element => <View style={[styles.entryRow, themeStyles.borderColor]}>
            <View style={styles.row}>
                <TouchableOpacity
                    onPress={() => this.filterNfts(item.SerialNumber)}
                    activeOpacity={0.7}
                    style={styles.deleteIconContainer}>
                    <AntDesign name="delete" size={22} color={themeStyles.likeHeartBackgroundColor.backgroundColor} />
                </TouchableOpacity>
                <ProfileInfoCardComponent
                    peekDisabled={true}
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
                <Text style={[styles.balance, themeStyles.fontColorMain]}> {this.calculateBidderBalance(item.BidAmountNanos)} </Text>
                <Text style={[styles.coinPrice, themeStyles.fontColorMain]}>~$ {calculateAndFormatBitCloutInUsd(item.BidAmountNanos)} </Text>
            </View>
        </View>;

        const renderHeader = <Text style={[themeStyles.fontColorSub, { padding: 10 }]}>You are about to sell your NFT. Are you sure?</Text>;

        const renderFooter = <>
            <View style={styles.subContainer}>
                <View style={styles.textContainer}>
                    <Text style={themeStyles.fontColorSub}>Selling Price</Text>
                    <Text style={themeStyles.fontColorSub}>
                        {this.calculateBidderBalance(this.state.sellingPriceCloutNanos)}
                        {' '}DESO(~${calculateAndFormatBitCloutInUsd(this.state.sellingPriceCloutNanos)})
                    </Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={themeStyles.fontColorSub}>Earnings</Text>
                    <Text style={themeStyles.fontColorSub}>
                        {this.calculateBidderBalance(this.state.earningsCloutNanos)}
                        {' '}DESO(~${calculateAndFormatBitCloutInUsd(this.state.earningsCloutNanos)})
                    </Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={themeStyles.fontColorSub}>Creator royalty</Text>
                    <Text style={themeStyles.fontColorSub}>
                        {this.calculateBidderBalance(this.state.creatorRoyaltyCloutNanos)}
                        {' '}DESO(~${calculateAndFormatBitCloutInUsd(this.state.creatorRoyaltyCloutNanos)})
                    </Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={themeStyles.fontColorSub}>Coin-holder royalty</Text>
                    <Text style={themeStyles.fontColorSub}>
                        {this.calculateBidderBalance(this.state.coinHolderRoyaltyCloutNanos)}
                        {' '}DESO(~${calculateAndFormatBitCloutInUsd(this.state.coinHolderRoyaltyCloutNanos)})
                    </Text>
                </View>
            </View>
            {
                this.props.route.params.hasUnlockableContent &&
                <View style={styles.inputContainer}>
                    <Text style={themeStyles.fontColorSub}>
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
                                themeStyles.borderColor,
                                themeStyles.fontColorMain,
                                Platform.OS === 'ios' && { paddingBottom: 40 }
                            ]
                        }
                    />
                </View>
            }
            <CloutFeedButton
                isLoading={this.state.isSellButtonLoading}
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.nftButtonContainer}
                title={'Sell NFTs'}
                onPress={this.handleSellNftBid}
            />
        </>;

        return <KeyboardAvoidingView
            style={[styles.container, themeStyles.containerColorMain]}
            behavior={behavior}
        >
            <FlatList
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.flatListStyle}
                keyExtractor={keyExtractor}
                renderItem={({ item }) => renderItem(item)}
                data={this.state.selectedNftsForSale}
            />
        </KeyboardAvoidingView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        flatListStyle: {
            paddingBottom: 15
        },
        entryRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            borderBottomWidth: 1,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10
        },
        deleteIconContainer: {
            marginRight: 10
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
        balance: {
            fontSize: 15,
            fontWeight: '600',
            paddingVertical: 5,
        },
        coinPrice: {
            fontSize: 13,
        },
        subContainer: {
            paddingHorizontal: 10
        },
        textContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10
        },
        nftButtonContainer: {
            width: 100,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginVertical: 20,
            alignSelf: 'center'
        },
        inputContainer: {
            padding: 10
        },
        input: {
            borderWidth: 1,
            marginVertical: 15,
            borderRadius: 3,
            padding: 10,
        },
    }
);
