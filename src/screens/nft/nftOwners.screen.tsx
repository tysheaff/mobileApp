import React, { Component } from 'react';
import { Text, StyleSheet, View, ScrollView, RefreshControl, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Post, Profile } from '@types';
import { themeStyles } from '@styles/globalColors';
import { globals } from '@globals/globals';
import { calculateAndFormatBitCloutInUsd, nftApi } from '@services';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    post: Post;
    navigation: StackNavigationProp<ParamListBase>;
    handleOwnBidInfo: (bid: Post) => void;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    owners: Post[];
}

export default class NftOwnersScreen extends Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isRefreshing: false,
            owners: []
        };

        this.init = this.init.bind(this);

        this.init(true);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private async init(isLoading: boolean): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isLoading });
            }
            const response = await nftApi.getNftBids(this.props.post.ProfileEntryResponse?.PublicKeyBase58Check, this.props.post.PostHashHex);
            const owners = response.NFTEntryResponses;
            response.NFTEntryResponses.sort((a: Post, b: Post) => a.SerialNumber - b.SerialNumber);
            let ownerBid;
            const minBidsArray: number[] = [];
            for (const owner of owners) {
                minBidsArray.push(owner.MinBidAmountNanos);
                if (owner.OwnerPublicKeyBase58Check === globals.user.publicKey) {
                    ownerBid = owner;
                }
            }
            if (ownerBid) {
                const minBidAmount = Math.min(...minBidsArray);
                ownerBid.MinBidAmountNanos = minBidAmount;
                this.props.handleOwnBidInfo(ownerBid);
            }

            if (this._isMounted) {
                this.setState({ owners });
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

    render(): JSX.Element {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const keyExtractor = (item: Post, index: number): string => `${item.ProfileEntryResponse?.PublicKeyBase58Check}_${index.toString()}`;

        const renderItem = ({ item }: { item: Post }): JSX.Element =>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.goToProfile(item.ProfileEntryResponse)}
                style=
                {
                    [
                        themeStyles.containerColorMain,
                        themeStyles.borderColor,
                        styles.ownerCard
                    ]
                }
            >
                <ProfileInfoCardComponent
                    profile={item.ProfileEntryResponse}
                    navigation={this.props.navigation}
                />
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
                        {this.calculateBidderBalance(item.LastAcceptedBidAmountNanos)}
                    </Text>
                    <Text style={[styles.coinPrice, themeStyles.fontColorMain]}>~$
                        {calculateAndFormatBitCloutInUsd(item.LastAcceptedBidAmountNanos)}
                    </Text>
                </View>
            </TouchableOpacity>;

        const renderRefresh: JSX.Element = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={() => this.init(true)}
        />;

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.owners === null ?
                    <ScrollView refreshControl={renderRefresh} >
                        <Text style={[styles.emptyOwners, themeStyles.fontColorSub]}>No owners for this post yet</Text>
                    </ScrollView> :
                    <>
                        <FlatList
                            data={this.state.owners}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
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
        emptyOwners: {
            fontSize: 16,
            textAlign: 'center',
            margin: 20
        },
        balance: {
            fontSize: 15,
            fontWeight: '600',
            paddingVertical: 5,
        },
        coinPrice: {
            fontSize: 13,
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
        rightContainer: {
            width: 60,
            justifyContent: 'center',
            alignItems: 'center'
        },
    }
);
