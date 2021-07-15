import { NavigationProp } from "@react-navigation/core";
import React from "react";
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import { DiamondSender } from '@types';
import { themeStyles } from '@styles';
import { calculateAndFormatBitCloutInUsd, getAnonymousProfile } from '@services';
import ProfileInfoCardComponent from "@components/profileInfo/profileInfoCard.component";

interface Props {
    navigation: NavigationProp<any>;
    diamondSender: DiamondSender;
}

interface State {
    coinPrice: string;
}

export class DiamondSenderComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        if (!this.props.diamondSender.ProfileEntryResponse) {
            this.props.diamondSender.ProfileEntryResponse = getAnonymousProfile(this.props.diamondSender.SenderPublicKeyBase58Check);
        }

        const diamondSenderCoinPriceUSD = calculateAndFormatBitCloutInUsd(
            this.props.diamondSender.ProfileEntryResponse.CoinPriceBitCloutNanos
        );

        this.state = {
            coinPrice: diamondSenderCoinPriceUSD
        };

        this.goToProfile = this.goToProfile.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.diamondSender?.SenderPublicKeyBase58Check !== p_nextProps.diamondSender?.SenderPublicKeyBase58Check;
    }

    private goToProfile() {
        if (this.props.diamondSender.ProfileEntryResponse &&
            this.props.diamondSender.ProfileEntryResponse.Username !== 'anonymous') {
            (this.props.navigation as any).push('UserProfile', {
                publicKey: this.props.diamondSender.ProfileEntryResponse.PublicKeyBase58Check,
                username: this.props.diamondSender.ProfileEntryResponse.Username,
                key: 'Profile_' + this.props.diamondSender.ProfileEntryResponse.PublicKeyBase58Check
            });
        }
    }

    render() {
        return <TouchableOpacity onPress={this.goToProfile} activeOpacity={1}>

            <View style={[styles.diamondSenderCard, themeStyles.containerColorMain, themeStyles.borderColor]}>
                <ProfileInfoCardComponent
                    publicKey={this.props.diamondSender.SenderPublicKeyBase58Check}
                    username={this.props.diamondSender.ProfileEntryResponse?.Username}
                    coinPrice={this.state.coinPrice}
                    verified={this.props.diamondSender.ProfileEntryResponse?.IsVerified}
                />
                <View style={styles.diamondsContainer}>
                    {
                        Array(this.props.diamondSender.HighestDiamondLevel).fill(0).map(
                            (_i, index) =>
                                <FontAwesome style={styles.diamondIcon}
                                    name="diamond"
                                    size={16}
                                    color={themeStyles.diamondColor.color}
                                    key={index} />
                        )
                    }
                    <Text style={[styles.totalDiamonds, themeStyles.fontColorMain]}>
                        {this.props.diamondSender.TotalDiamonds}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>;
    }
}

const styles = StyleSheet.create(
    {
        diamondSenderCard: {
            flexDirection: 'row',
            paddingVertical: 16,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width

        },
        diamondIcon: {
            marginLeft: 1,
            marginTop: 1
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