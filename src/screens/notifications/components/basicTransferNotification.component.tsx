import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Profile, Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { globals } from '@globals/globals';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';
import { notificationsStyles } from '../styles/notificationStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    profile: Profile;
    goToProfile: (p_userKey: string, p_username: string) => void;
    notification: Notification;
    navigation: StackNavigationProp<ParamListBase>;
}

export class BasicTransferNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        const output = this.props.notification.TxnOutputResponses?.find(
            p_output => p_output.PublicKeyBase58Check === globals.user.publicKey
        );

        let bitCloutAmount = '';
        let usdAmount = '';

        if (output) {
            bitCloutAmount = (output.AmountNanos / 1000000000).toFixed(2);
            usdAmount = calculateAndFormatBitCloutInUsd(output.AmountNanos);
        }

        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                activeOpacity={1}>
                <ProfileInfoImageComponent
                    navigation={this.props.navigation}
                    profile={this.props.profile}
                />
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#00803c' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="dollar" size={14} color="white" />
                </View>

                <View style={notificationsStyles.textContainer}>
                    <ProfileInfoUsernameComponent
                        navigation={this.props.navigation}
                        profile={this.props.profile}
                    />
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> sent you</Text>
                    <Text style={[notificationsStyles.usernameText, themeStyles.fontColorMain]}> {bitCloutAmount} </Text>
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>BitClout!</Text>
                    <Text style={[notificationsStyles.usernameText, themeStyles.fontColorMain]}> (~${usdAmount})</Text>
                </View>
            </TouchableOpacity>
        );
    }

}
