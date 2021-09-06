import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, Keyboard } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import NFTBiddersScreen from './nftBidders.screen';
import { EventType, Post, ToggleSellNftModalEvent as ToggleSellNftModalEvent } from '@types';
import { globals } from '@globals/globals';
import { api, nftApi } from '@services';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { eventManager } from '@globals/injector';
import { FontAwesome } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { TextWithLinks } from '@components/textWithLinks.component';
import NftOwnersScreen from './components/nftOwners.screen';
import UnlockableTextFormComponent from './components/unlockableTextForm.component';
import CloutFeedButton from '@components/cloutfeedButton.component';

type UnlockableText = {
    SerialNumber: number;
    EncryptedText: string;
}

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
    isLoading: boolean,
    minBidAmountNanos: number;
    serialNumber: number;
    isNftForSale: boolean;
    isButtonLoading: boolean;
    availableBids: number;
    isUserBidder: boolean;
    hasUnlockableContent: boolean;
    selectedNftsForSale: Post[];
    encryptedUnlockableTexts: UnlockableText[];
    isUnlockableTextModalVisible: boolean;
    isUserOwner: boolean;
    selectModeOn: boolean;
    sendUnlockableTextFormVisible: boolean;
    isSellButtonLoading: boolean;
    ownUserBidders: Post[];
}

const NFTTab = createMaterialTopTabNavigator();

export default class NFTTabNavigator extends React.Component<Props, State> {

    private _isMounted = false;

    private _unsubscribes: (() => void) = () => { };

    private _unsubscribeRefreshOnFocus: (() => void) = () => { };

    private _noBids = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            minBidAmountNanos: 0,
            serialNumber: 0,
            isNftForSale: this.props.route.params.post.NumNFTCopiesForSale !== 0,
            isButtonLoading: true,
            availableBids: this.props.route.params.post.NumNFTCopiesForSale,
            isUserBidder: true,
            hasUnlockableContent: false,
            selectedNftsForSale: [],
            encryptedUnlockableTexts: [],
            isUnlockableTextModalVisible: false,
            isUserOwner: false,
            selectModeOn: false,
            sendUnlockableTextFormVisible: false,
            isSellButtonLoading: false,
            ownUserBidders: []
        };

        this.init = this.init.bind(this);
        this.goToBidEditions = this.goToBidEditions.bind(this);
        this.handleSingleAuctionAlert = this.handleSingleAuctionAlert.bind(this);
        this.handleSingleAuction = this.handleSingleAuction.bind(this);
        this.handleOwnBidInfo = this.handleOwnBidInfo.bind(this);
        this.goToAuctionStatus = this.goToAuctionStatus.bind(this);
        this.goToSellNft = this.goToSellNft.bind(this);
        this.toggleTextModal = this.toggleTextModal.bind(this);
        this.setSelectModeOn = this.setSelectModeOn.bind(this);
        this.toggleSendUnlockableText = this.toggleSendUnlockableText.bind(this);
        this.handleSellNftBidAlert = this.handleSellNftBidAlert.bind(this);
        this.handleSellSingleNftBid = this.handleSellSingleNftBid.bind(this);
        this.refresh = this.refresh.bind(this);
        this.init(false);

        this._unsubscribeRefreshOnFocus = this.props.navigation.addListener('focus',
            () => {
                this.init(true);
                this.refresh();
            }
        );

        const unsubscribeNftButton = eventManager.addEventListener(
            EventType.ToggleSetSelectedNfts,
            (event: ToggleSellNftModalEvent) => {
                if (this._isMounted) {
                    this.setState(
                        {
                            selectedNftsForSale: event.selectedNftsForSale,
                        }
                    );
                }
            }
        );

        this._unsubscribes = unsubscribeNftButton;
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
        this._unsubscribes();

        this._unsubscribeRefreshOnFocus();
    }

    private refresh(): void {
        if (this._isMounted) {
            this.setState({ selectModeOn: false, selectedNftsForSale: [] });
        }
    }

    private async init(isLoading: boolean): Promise<void> {
        try {
            if (this._isMounted && isLoading) {
                this.setState({ isLoading });
            }
            let isUserBidder = false;
            let isUserOwner = false;
            const ownUserBidders: Post[] = [];
            const availableSerialNumbers: number[] = [];
            const encryptedUnlockableTexts: UnlockableText[] = [];

            const response = await nftApi.getNftBids(globals.user.publicKey, this.props.route.params.post.PostHashHex);
            const bidResponses = response.BidEntryResponses;
            const nftResponses = response.NFTEntryResponses;
            const hasUnlockableContent = response.PostEntryResponse?.HasUnlockable === true;
            this._noBids = bidResponses === null;

            for (const nft of nftResponses) {
                if (nft.OwnerPublicKeyBase58Check === globals.user.publicKey) {
                    availableSerialNumbers.push(nft.SerialNumber);
                }
            }

            if (bidResponses) {
                for (const bidEntry of bidResponses) {
                    if (bidEntry?.PublicKeyBase58Check === globals.user.publicKey) {
                        isUserBidder = true;
                    }
                    if (availableSerialNumbers.includes(bidEntry.SerialNumber)) {
                        ownUserBidders.push(bidEntry);
                    }
                }
            }

            if (nftResponses) {
                for (const nftEntry of nftResponses) {
                    if (nftEntry.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey) {
                        isUserOwner = true;
                    }
                    if (nftEntry.EncryptedUnlockableText && hasUnlockableContent) {
                        const decryptedText = await signing.decryptShared(nftEntry.LastOwnerPublicKeyBase58Check, nftEntry.EncryptedUnlockableText);
                        const transaction: UnlockableText = {
                            SerialNumber: nftEntry.SerialNumber,
                            EncryptedText: decryptedText
                        };
                        encryptedUnlockableTexts.push(transaction);
                    }
                }
            }

            encryptedUnlockableTexts.sort((a: UnlockableText, b: UnlockableText) => a.SerialNumber - b.SerialNumber);
            this.setState(
                {
                    isUserBidder,
                    hasUnlockableContent,
                    encryptedUnlockableTexts,
                    isUserOwner,
                    availableBids: response.PostEntryResponse.NumNFTCopiesForSale,
                    isNftForSale: response.PostEntryResponse.NumNFTCopiesForSale !== 0,
                    ownUserBidders
                }
            );
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState(
                    {
                        isLoading: false,
                        isButtonLoading: false
                    }
                );
            }
        }
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

    private async handleSingleAuction(): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isButtonLoading: true });
            }

            const transactionResponse = await nftApi.updateNftBid(
                !this.state.isNftForSale,
                this.state.minBidAmountNanos,
                this.props.route.params.post?.PostHashHex,
                this.state.serialNumber,
                globals.user.publicKey
            );
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);
            setTimeout(() => { this.init(true); }, 700);
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private handleSingleAuctionAlert(): void {
        if (this.state.selectModeOn) {
            return this.setState({ selectModeOn: false });
        }
        const title = this.state.isNftForSale ? 'Close Auction' : 'Open Auction';
        const body = this.state.isNftForSale ? 'You are about to close the auction. This will cancel all bids on your NFT and prevent new bids from being submitted.' :
            'Are you sure you want to put the auction on sale again?';
        Alert.alert(
            title,
            body,
            [
                {
                    text: 'Yes',
                    onPress: this.handleSingleAuction
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
            this.setState({ minBidAmountNanos, serialNumber, isButtonLoading: false });
        }
    }

    private goToAuctionStatus(): void {
        if (this.state.selectModeOn) {
            return this.setState({ selectModeOn: false });
        }
        this.props.navigation.push(
            'AuctionTabNavigator',
            {
                post: this.props.route.params.post,
            }
        );
    }

    private setSelectModeOn(): void {
        if (this._isMounted) {
            if (this.state.selectedNftsForSale.length !== 0 && this.state.selectModeOn) {
                if (this.props.route.params.post.NumNFTCopies <= 1 && this.state.hasUnlockableContent) {
                    return this.toggleSendUnlockableText(true);
                } else if (this.props.route.params.post.NumNFTCopies <= 1 && !this.state.hasUnlockableContent) {
                    return this.handleSellNftBidAlert();
                }
                this.goToSellNft();
            }
            return this.setState({ selectModeOn: true });
        }
    }

    private async handleSellSingleNftBid(): Promise<void> {
        if (this._isMounted) {
            this.setState({ isSellButtonLoading: true });
        }
        try {
            const transactionResponse = await nftApi.sellNft(
                this.state.selectedNftsForSale[0].BidAmountNanos,
                this.state.selectedNftsForSale[0].ProfileEntryResponse?.PublicKeyBase58Check,
                '',
                this.props.route.params.post.PostHashHex,
                this.state.selectedNftsForSale[0].SerialNumber,
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
                            this.toggleSendUnlockableText(false);
                            this.init(true);
                        }
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

    private goToSellNft(): void {
        this.props.navigation.push(
            'SellNft',
            {
                selectedNftsForSale: this.state.selectedNftsForSale,
                post: this.props.route.params.post,
                hasUnlockableContent: this.state.hasUnlockableContent
            }
        );
    }

    private toggleTextModal(isVisible: boolean): void {
        if (this._isMounted) {
            this.setState({ isUnlockableTextModalVisible: isVisible });
        }
    }

    private toggleSendUnlockableText(sendUnlockableTextFormVisible: boolean): void {
        if (this._isMounted) {
            this.setState({ sendUnlockableTextFormVisible });
        }
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const closeAuctionButtonTitle = this.state.selectModeOn ? 'Cancel' : 'Close auction';
        const sellButtonTitle = this.state.selectModeOn ?
            'Confirm' :
            this.props.route.params.post.NumNFTCopies === 1 ?
                'Sell NFT' :
                'Sell NFTs';

        const editAuctionsTitle = this.state.selectModeOn ? 'Cancel' : 'Edit Auctions';
        const isSellButtonDisabled = this.state.selectedNftsForSale.length === 0 && this.state.selectModeOn;
        const sellButtonBackgroundColor = isSellButtonDisabled ? 'rgba(0, 126, 245, 0.6)' : themeStyles.verificationBadgeBackgroundColor.backgroundColor;

        const keyExtractor = (item: UnlockableText, index: number): string => `${item.EncryptedText}_${index.toString()}`;

        const renderHeader = <>
            <Text style={[themeStyles.fontColorMain, styles.unlockableTitle]}>Unlockable Content</Text>
            <View style={[styles.titleBorder, themeStyles.borderColor]} />
        </>;
        const renderItem = (item: UnlockableText) => <View>
            <View style={styles.row}>
                <Text style={themeStyles.fontColorSub}>#{item.SerialNumber}</Text>
                <TextWithLinks
                    navigation={this.props.navigation}
                    style={[themeStyles.fontColorMain, styles.unlockableText]}
                    text={item.EncryptedText}
                />
            </View>
        </View>;

        return <View style={[{ flex: 1, }, themeStyles.containerColorMain]}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={[styles.availableNfts, themeStyles.fontColorMain]}>
                        <Text style={{ fontWeight: 'bold' }}>{this.state.availableBids} </Text>
                        of
                        <Text style={{ fontWeight: 'bold' }}> {this.props.route.params.post.NumNFTCopies} </Text>
                        availabe
                    </Text>
                    {
                        this.state.hasUnlockableContent &&
                        <>
                            {
                                this.state.encryptedUnlockableTexts.length === 0 ?
                                    <View style={styles.lockContainer}>
                                        <FontAwesome name="lock" size={16} color={themeStyles.fontColorMain.color} />
                                        <Text style={[styles.unlockableContentText, themeStyles.fontColorSub]}>Unlockable Content</Text>
                                    </View> :
                                    <TouchableOpacity
                                        activeOpacity={.8}
                                        onPress={() => this.toggleTextModal(true)}
                                        style={styles.lockContainer}>
                                        <FontAwesome name="unlock" size={16} color={themeStyles.fontColorMain.color} />
                                        <Text style={[styles.unlockableContentText, themeStyles.fontColorSub]}>Show Unlockable</Text>
                                    </TouchableOpacity>
                            }
                            <Modal animationIn={'slideInUp'}
                                animationOut={'slideOutDown'}
                                animationInTiming={400}
                                animationOutTiming={400}
                                onBackdropPress={() => this.toggleTextModal(false)}
                                onBackButtonPress={() => this.toggleTextModal(false)}
                                isVisible={this.state.isUnlockableTextModalVisible}
                                style={styles.modal}>
                                <View style={[themeStyles.modalBackgroundColor, styles.innerModalContainer]} >
                                    <FlatList
                                        ListHeaderComponent={renderHeader}
                                        contentContainerStyle={styles.flatListStyle}
                                        keyExtractor={keyExtractor}
                                        renderItem={({ item }) => renderItem(item)}
                                        data={this.state.encryptedUnlockableTexts}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => this.toggleTextModal(false)}
                                    activeOpacity={1}
                                    style={
                                        [
                                            styles.modalButton,
                                            themeStyles.verificationBadgeBackgroundColor
                                        ]
                                    }>
                                    <FontAwesome name="lock" size={20} color="white" />
                                    <Text style={styles.nftButtonText}>Hide Unlockable Text</Text>
                                </TouchableOpacity>
                            </Modal>
                        </>
                    }
                </View>
                <View style={{ flexDirection: 'row' }}>
                    {
                        !globals.readonly && (
                            this.props.route.params.post.NumNFTCopies > 1 &&
                            (
                                <>
                                    {
                                        this.state.isUserOwner ?
                                            <>
                                                <CloutFeedButton
                                                    backgroundColor={this.state.selectModeOn ? themeStyles.likeHeartBackgroundColor.backgroundColor : themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                                    styles={[styles.nftButtonContainer, { width: 110 }]}
                                                    title={editAuctionsTitle}
                                                    onPress={this.goToAuctionStatus}
                                                />
                                            </>
                                            : this.state.isNftForSale &&
                                            <CloutFeedButton
                                                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                                styles={styles.nftButtonContainer}
                                                title={'Place a bid'}
                                                onPress={this.goToBidEditions}
                                            />
                                    }
                                </>
                            )

                        )
                    }

                    {
                        !globals.readonly && this.props.route.params.post.NumNFTCopies === 1 && (
                            this.state.isUserOwner ? (
                                (
                                    this.state.isNftForSale ?
                                        <CloutFeedButton
                                            isLoading={this.state.isButtonLoading}
                                            backgroundColor={themeStyles.likeHeartBackgroundColor.backgroundColor}
                                            styles={[styles.nftButtonContainer, { width: 115 }]}
                                            title={closeAuctionButtonTitle}
                                            onPress={this.handleSingleAuctionAlert}
                                        />
                                        :
                                        this.state.isUserOwner &&
                                        <CloutFeedButton
                                            isLoading={this.state.isButtonLoading}
                                            backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                            styles={styles.nftButtonContainer}
                                            title={'Put on Sale'}
                                            onPress={this.handleSingleAuctionAlert}
                                        />
                                )
                            ) :
                                (
                                    this.state.isNftForSale &&
                                    <CloutFeedButton
                                        backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                                        styles={styles.nftButtonContainer}
                                        title={'Place a bid'}
                                        onPress={this.goToBidEditions}
                                    />
                                )
                        )
                    }
                    {
                        !globals.readonly &&
                        this.state.isUserOwner &&
                        this.state.isNftForSale &&
                        !this._noBids &&
                        this.state.ownUserBidders.length !== 0 &&
                        <CloutFeedButton
                            isLoading={this.state.isSellButtonLoading}
                            backgroundColor={sellButtonBackgroundColor}
                            styles={[styles.nftButtonContainer, { marginLeft: 10 }]}
                            disabled={isSellButtonDisabled}
                            title={sellButtonTitle}
                            onPress={this.setSelectModeOn}
                        />
                    }
                </View>
            </View>
            <NFTTab.Navigator
                sceneContainerStyle={themeStyles.containerColorMain}
                tabBarOptions={
                    {
                        style: themeStyles.containerColorMain,
                        indicatorStyle: { backgroundColor: themeStyles.fontColorMain.color },
                        tabStyle: { marginTop: 0 },
                        activeTintColor: themeStyles.fontColorMain.color,
                        labelStyle: { fontWeight: 'bold', textTransform: 'none' },
                        inactiveTintColor: themeStyles.fontColorSub.color,
                    }
                }
            >
                <NFTTab.Screen name="Bidders" children=
                    {
                        props => <NFTBiddersScreen
                            {...props}
                            ownUserBidders={this.state.ownUserBidders}
                            refresh={(isLoading: boolean) => this.init(isLoading)}
                            selectModeOn={this.state.selectModeOn}
                            numNFTCopies={this.props.route.params.post.NumNFTCopies}
                            post={this.props.route.params.post}
                            selectedTab={'bidders'}
                            navigation={this.props.navigation}
                            hasUnlockableContent={this.state.hasUnlockableContent}
                            isNftForSale={this.state.isNftForSale}
                        />
                    }
                />

                <NFTTab.Screen name="Owners" children=
                    {
                        props => <NftOwnersScreen
                            {...props}
                            post={this.props.route.params.post}
                            handleOwnBidInfo={this.handleOwnBidInfo}
                        />
                    }
                />

                {
                    this.state.isUserBidder &&
                    <NFTTab.Screen name="My Bids" children=
                        {
                            props => <NFTBiddersScreen
                                {...props}
                                refresh={(isLoading: boolean) => this.init(isLoading)}
                                selectModeOn={this.state.selectModeOn}
                                selectedTab={'myBids'}
                                isNftForSale={this.state.isNftForSale}
                                post={this.props.route.params.post}
                                navigation={this.props.navigation}
                            />
                        }
                    />
                }
            </NFTTab.Navigator>
            {
                this.state.sendUnlockableTextFormVisible &&
                <UnlockableTextFormComponent
                    refresh={this.init}
                    selectedNftForSale={this.state.selectedNftsForSale[0]}
                    toggleModal={this.toggleSendUnlockableText}
                    isVisible={this.state.sendUnlockableTextFormVisible}
                    post={this.state.selectedNftsForSale[0]}
                    postHashHex={this.props.route.params.post.PostHashHex}
                />
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            padding: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        nftButtonContainer: {
            width: 100,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4
        },
        nftButtonText: {
            fontWeight: '600',
            color: 'white',
            fontSize: 13
        },
        availableNfts: {
            fontSize: 16
        },
        lockContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 3
        },
        unlockableContentText: {
            fontSize: 11,
            marginLeft: 4
        },
        modal: {
            margin: 0
        },
        innerModalContainer: {
            marginHorizontal: 25,
            borderRadius: 4,
            padding: 15
        },
        flatListStyle: {
            paddingVertical: 5
        },
        modalButton: {
            width: 170,
            height: 30,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            alignItems: 'center',
            borderRadius: 4,
            alignSelf: 'center',
            marginTop: 20
        },
        unlockableTitle: {
            fontSize: 17,
            textAlign: 'center',
            marginBottom: 6
        },
        titleBorder: {
            width: '100%',
            borderWidth: 1,
            borderRadius: 2,
            marginBottom: 15,
            alignSelf: 'center'
        },
        unlockableText: {
            fontSize: 15,
            marginLeft: 5
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5
        }
    }
);
