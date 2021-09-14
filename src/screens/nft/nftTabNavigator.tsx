import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, Keyboard } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import NFTBiddersScreen from './nftBidders.screen';
import { BidEdition, EventType, Post, ToggleSellNftModalEvent as ToggleSellNftModalEvent } from '@types';
import { globals } from '@globals/globals';
import { api, nftApi } from '@services';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { eventManager } from '@globals/injector';
import { FontAwesome } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { TextWithLinks } from '@components/textWithLinks.component';
import NftOwnersScreen from './nftOwners.screen';
import UnlockableTextFormComponent from './components/unlockableTextForm.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import MinBidAmountFormComponent from './components/minBidAmountForm.component';

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
    isNftForSale: boolean;
    isButtonLoading: boolean;
    availableBids: number;
    isUserBidder: boolean;
    hasUnlockableContent: boolean;
    selectedNftsForSale: Post[];
    ownNFTs: Post[];
    encryptedUnlockableTexts: UnlockableText[];
    isUnlockableTextModalVisible: boolean;
    isUserOwner: boolean;
    selectModeOn: boolean;
    sendUnlockableTextFormVisible: boolean;
    isSellButtonLoading: boolean;
    ownUserBidders: Post[];
    newMinBidAmountFormVisible: boolean;
}

const NFTTab = createMaterialTopTabNavigator();

export default class NFTTabNavigator extends React.Component<Props, State> {

    private _isMounted = false;

    private _unsubscribes: (() => void) = () => { };

    private _unsubscribeRefreshOnFocus: (() => void) = () => { };

    private _userCanBid = true;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
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
            ownUserBidders: [],
            newMinBidAmountFormVisible: false,
            ownNFTs: []
        };

        this.init = this.init.bind(this);
        this.goToBidEditions = this.goToBidEditions.bind(this);
        this.closeSingleAuctionAlert = this.closeSingleAuctionAlert.bind(this);
        this.closeSingleAuction = this.closeSingleAuction.bind(this);
        this.handleOwnBidInfo = this.handleOwnBidInfo.bind(this);
        this.goToAuctionStatus = this.goToAuctionStatus.bind(this);
        this.goToSellNft = this.goToSellNft.bind(this);
        this.toggleTextModal = this.toggleTextModal.bind(this);
        this.setSelectModeOn = this.setSelectModeOn.bind(this);
        this.toggleSendUnlockableText = this.toggleSendUnlockableText.bind(this);
        this.handleSellNftBidAlert = this.handleSellNftBidAlert.bind(this);
        this.handleSellSingleNftBid = this.handleSellSingleNftBid.bind(this);
        this.refresh = this.refresh.bind(this);
        this.toggleMultipleNFTOptions = this.toggleMultipleNFTOptions.bind(this);
        this.toggleNewMinBidAmount = this.toggleNewMinBidAmount.bind(this);
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

            const responses = await Promise.all(
                [
                    nftApi.getNftBids(globals.user.publicKey, this.props.route.params.post.PostHashHex),
                    nftApi.getNftBidEditions(globals.user.publicKey, this.props.route.params.post.PostHashHex),
                ]
            );
            const bidEditions = Object.values(responses[1].SerialNumberToNFTEntryResponse).filter((item: any) => item.OwnerPublicKeyBase58Check !== globals.user.publicKey) as BidEdition[];

            if (bidEditions.length === 0) {
                this._userCanBid = false;
            }
            const bidResponses = responses[0].BidEntryResponses;
            const nftResponses = responses[0].NFTEntryResponses;
            const hasUnlockableContent = responses[0].PostEntryResponse?.HasUnlockable === true;

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

            ownUserBidders.sort((a: any, b: any) => b.BidAmountNanos - a.BidAmountNanos);
            if (nftResponses) {
                for (const nftEntry of nftResponses) {
                    if (nftEntry.OwnerPublicKeyBase58Check === globals.user.publicKey) {
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
                    availableBids: responses[0].PostEntryResponse.NumNFTCopiesForSale,
                    isNftForSale: responses[0].PostEntryResponse.NumNFTCopiesForSale !== 0,
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

    private async closeSingleAuction(): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isButtonLoading: true });
            }

            const transactionResponse = await nftApi.updateNftBid(
                false,
                this.state.ownNFTs[0].MinBidAmountNanos,
                this.props.route.params.post?.PostHashHex,
                this.state.ownNFTs[0].SerialNumber,
                globals.user.publicKey
            );
            const transactionHex: string = transactionResponse.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);
            setTimeout(() => { this.init(true); }, 750);
        } catch (error) {
            globals.defaultHandleError(error);
            if (this._isMounted) {
                this.setState({ isButtonLoading: false });
            }
        }
    }

    private closeSingleAuctionAlert(): void {
        if (this.state.selectModeOn && this._isMounted) {
            return this.setState({ selectModeOn: false });
        }
        const title = 'Close Auction';
        const body = 'You are about to close the auction. This will cancel all bids on your NFT and prevent new bids from being submitted.';
        Alert.alert(
            title,
            body,
            [
                {
                    text: 'Yes',
                    onPress: this.closeSingleAuction
                },
                {
                    text: 'Cancel',
                    onPress: () => { return; },
                    style: 'cancel'
                },
            ]
        );
    }

    private handleOwnBidInfo(selectedNftsForSale: Post): void {
        if (this._isMounted) {
            this.setState({ ownNFTs: [selectedNftsForSale] });
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

    private toggleNewMinBidAmount(newMinBidAmountFormVisible: boolean): void {
        if (this._isMounted) {
            this.setState({ newMinBidAmountFormVisible });
        }
    }

    private toggleMultipleNFTOptions(): void {
        if (this.state.selectModeOn) {
            return this.setState({ selectModeOn: false });
        }
        const options = ['Place a bid', 'Sell NFT', 'Edit NFT', 'Cancel'];
        const callback = (optionIndex: number) => {
            switch (optionIndex) {
                case 0:
                    this.goToBidEditions();
                    break;
                case 1:
                    this.setSelectModeOn();
                    break;
                case 2:
                    this.goToAuctionStatus();
                    break;
            }
        };

        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [] }
            }
        );
    }

    private renderPlaceBidButton(): JSX.Element | undefined {
        if (
            (!this.state.isUserOwner && this.state.isNftForSale) ||
            (this.state.isUserOwner && this.state.isNftForSale && !this.state.selectModeOn && this._userCanBid)
        ) {
            return <CloutFeedButton
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.sellNftButtonContainer}
                title={'Place a bid'}
                onPress={this.goToBidEditions}
            />;
        }
    }

    private renderCloseAuctionButton(): JSX.Element | undefined {
        if (
            this.state.isUserOwner &&
            this.state.isNftForSale &&
            !this.state.selectModeOn &&
            this.props.route.params.post.NumNFTCopies === 1
        ) {
            return <CloutFeedButton
                isLoading={this.state.isButtonLoading}
                backgroundColor={themeStyles.likeHeartBackgroundColor.backgroundColor}
                styles={styles.editAuctionsButtonContainer}
                title={'Close Auction'}
                onPress={this.closeSingleAuctionAlert}
            />;
        }
    }

    private renderPutOnSaleButton(): JSX.Element | undefined {
        if (this.state.isUserOwner && !this.state.isNftForSale && this.props.route.params.post.NumNFTCopies === 1) {
            return <CloutFeedButton
                isLoading={this.state.isButtonLoading}
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.editAuctionsButtonContainer}
                title={'Put on Sale'}
                onPress={() => this.toggleNewMinBidAmount(true)}
            />;
        }
    }

    private renderSellNFTButton(): JSX.Element | undefined {
        if (!this.state.selectModeOn && this.state.isUserOwner && this.state.isNftForSale && this.state.ownUserBidders.length !== 0) {
            return <CloutFeedButton
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.sellNftButtonContainer}
                title={'Sell NFT'}
                onPress={this.setSelectModeOn}
            />;
        }
    }

    private renderConfirmButton(): JSX.Element | undefined {
        if (this.state.isUserOwner && this.state.selectModeOn) {
            const disabled = this.state.selectedNftsForSale.length === 0;
            return <CloutFeedButton
                disabled={disabled}
                isLoading={this.state.isSellButtonLoading}
                backgroundColor={disabled ? 'rgba(0, 126, 245, 0.6)' : themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.sellNftButtonContainer}
                title={'Confirm'}
                onPress={this.setSelectModeOn}
            />;
        }
    }

    private renderCancelButton(): JSX.Element | undefined {
        if (this.state.isUserOwner && this.state.selectModeOn) {
            return <CloutFeedButton
                backgroundColor={themeStyles.likeHeartBackgroundColor.backgroundColor}
                styles={styles.nftButtonContainer}
                title={'Cancel'}
                onPress={this.closeSingleAuctionAlert}
            />;
        }
    }

    private renderEditAuctionButton(): JSX.Element | undefined {
        if (this.state.isUserOwner && !this.state.selectModeOn && this.props.route.params.post.NumNFTCopies > 1) {
            return <CloutFeedButton
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.editAuctionsButtonContainer}
                title={'Edit Auctions'}
                onPress={this.goToAuctionStatus}
            />;
        }
    }

    private renderNFTOptionsButton(): JSX.Element | undefined {
        return <>
            {this.renderCancelButton()}
            {this.renderConfirmButton()}
            <CloutFeedButton
                isLoading={this.state.isSellButtonLoading}
                backgroundColor={themeStyles.verificationBadgeBackgroundColor.backgroundColor}
                styles={styles.editAuctionsButtonContainer}
                title={'NFT Options'}
                onPress={this.toggleMultipleNFTOptions}
            />
        </>;
    }

    private renderNFTButtons(): JSX.Element | undefined {
        if (globals.readonly) {
            return undefined;
        }
        if (this.state.isUserOwner && this._userCanBid && this.state.ownUserBidders.length !== 0 && !this.state.selectModeOn) {
            return this.renderNFTOptionsButton();
        }
        return <>
            {this.renderCloseAuctionButton()}
            {this.renderPutOnSaleButton()}
            {this.renderEditAuctionButton()}
            {this.renderPlaceBidButton()}
            {this.renderSellNFTButton()}
            {this.renderCancelButton()}
            {this.renderConfirmButton()}
        </>;
    }

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }
        const keyExtractor = (item: UnlockableText, index: number): string => `${item.EncryptedText}_${index.toString()}`;
        const renderHeader = <>
            <Text style={[themeStyles.fontColorMain, styles.unlockableTitle]}>Unlockable Content</Text>
            <View style={[styles.titleBorder, themeStyles.recloutBorderColor]} />
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
                        <Text style={styles.auctionCount}>{this.state.availableBids} </Text>
                        of
                        <Text style={styles.auctionCount}> {this.props.route.params.post.NumNFTCopies} </Text>
                        available
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
                    {this.renderNFTButtons()}
                </View>
            </View>
            <NFTTab.Navigator
                sceneContainerStyle={themeStyles.containerColorMain}
                tabBarOptions={
                    {
                        style: [themeStyles.containerColorMain, styles.tabBarStyle],
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
                    postHashHex={this.props.route.params.post.PostHashHex}
                />
            }
            {
                this.state.newMinBidAmountFormVisible &&
                <MinBidAmountFormComponent
                    refresh={this.init as any}
                    isSingleNFT={true}
                    auctions={this.state.ownNFTs}
                    toggleModal={this.toggleNewMinBidAmount}
                    isVisible={this.state.newMinBidAmountFormVisible}
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
        sellNftButtonContainer: {
            width: 100,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4,
            marginLeft: 10
        },
        auctionCount: {
            fontWeight: 'bold'
        },
        editAuctionsButtonContainer: {
            width: 115,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4
        },
        tabBarStyle: {
            elevation: 0,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0
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
            marginBottom: 6,
            fontWeight: '700'
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
