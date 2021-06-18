import { View, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Image, Text, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import React from "react";
import { Profile, User } from "@types";
import { api } from "@services";
import { globals } from "@globals/globals";
import { themeStyles } from '@styles/globalColors';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { NavigationProp } from '@react-navigation/native';

interface DiamondSender {
    DiamondLevel: number;
    DiamondSenderProfile: Profile;
}

interface Props {
    navigation: NavigationProp<any>;
    postHashHex: string;
}

interface State {
    isLoading: boolean;
    diamondSenders: DiamondSender[];
    isLoadingMore: boolean;
}

export class PostDiamondStatsComponent extends React.Component<Props, State> {

    private _noMoreData = false;
    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            diamondSenders: [],
            isLoadingMore: false
        };

        this.loadDiamondSenders(false);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async loadDiamondSenders(p_loadMore: boolean) {
        try {
            if (this.state.isLoadingMore || this._noMoreData) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
            }

            const response = await api.getDiamondSendersForPost(globals.user.publicKey, this.props.postHashHex, 50, this.state.diamondSenders.length);
            const diamondSenders: DiamondSender[] = response.DiamondSenders;

            let newDiamondSenders = this.state.diamondSenders;
            if (diamondSenders?.length > 0) {
                for (const diamondSender of diamondSenders) {
                    diamondSender.DiamondSenderProfile.ProfilePic = api.getSingleProfileImage(diamondSender.DiamondSenderProfile.PublicKeyBase58Check);
                    diamondSender.DiamondSenderProfile.FormattedCoinPriceUSD = calculateAndFormatBitCloutInUsd(
                        diamondSender.DiamondSenderProfile.CoinPriceBitCloutNanos
                    );
                }

                newDiamondSenders.push(...diamondSenders);
            }

            if (diamondSenders?.length < 50) {
                this._noMoreData = true;
            }

            if (this._isMounted) {
                this.setState({ diamondSenders: newDiamondSenders, isLoading: false, isLoadingMore: false });
            }

        } catch {
        }
    }

    private goToProfile(p_profile: Profile) {
        (this.props.navigation as any).push(
            'UserProfile',
            {
                publicKey: p_profile.PublicKeyBase58Check,
                username: p_profile.Username,
                key: 'Profile_' + p_profile.PublicKeyBase58Check
            }
        );
    }

    render() {
        if (this.state.isLoading) {
            return <View style={{ height: 200, justifyContent: 'center' }}>
                <ActivityIndicator style={{ alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
            </View>;
        }

        const keyExtractor = (item: DiamondSender, index: number) => item.DiamondSenderProfile.PublicKeyBase58Check + index;
        const renderItem = ({ item }: { item: DiamondSender }) => <TouchableOpacity onPress={() => this.goToProfile(item.DiamondSenderProfile)} activeOpacity={1}>
            <View style={[styles.diamondSenderCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                <Image style={styles.profileImage}
                    source={{ uri: item.DiamondSenderProfile.ProfilePic }}></Image>

                <View>
                    <Text style={[styles.username, themeStyles.fontColorMain]}>{item.DiamondSenderProfile.Username}</Text>
                    <View style={[styles.diamondSenderCoinPriceContainer, themeStyles.chipColor]}>
                        <Text style={[styles.diamondSenderCoinPriceText, themeStyles.fontColorMain]}>~${item.DiamondSenderProfile.FormattedCoinPriceUSD}</Text>
                    </View>
                </View>

                <View style={styles.diamondsContainer}>
                    {
                        Array(item.DiamondLevel).fill(0).map(
                            (_i, index) =>
                                <FontAwesome style={{ marginLeft: 1, marginTop: 1 }} name="diamond" size={18} color={themeStyles.diamondColor.color} key={index} />
                        )
                    }
                </View>
            </View>
        </TouchableOpacity>;

        return <FlatList
            data={this.state.diamondSenders}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={() => this.loadDiamondSenders(true)}
            onEndReachedThreshold={3}
            maxToRenderPerBatch={20}
            windowSize={20}
            ListFooterComponent={this.state.isLoadingMore && !this.state.isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined}
        />;
    }
}

const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        diamondSenderCard: {
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 10,
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        username: {
            fontWeight: '700',
            width: Dimensions.get('window').width / 2
        },
        diamondSenderCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6
        },
        diamondSenderCoinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        diamondsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 'auto'
        },
        totalDiamonds: {
            marginLeft: 10,
            fontSize: 18,
            fontWeight: '600'
        }
    }
);