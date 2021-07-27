import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { calculateBitCloutInUSD } from '@services';
import { Profile, Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import { FontAwesome } from '@expo/vector-icons';
import { notificationsStyles } from '../styles/notificationStyles';

interface Props {
    profile: Profile;
    goToProfile: (p_userKey: string, p_username: string) => void;
    notification: Notification;
}

export class CreatorCoinNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        const bitClout = this.props.notification.Metadata.CreatorCoinTxindexMetadata?.BitCloutToSellNanos as number;
        const usd = calculateBitCloutInUSD(bitClout);
        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => this.props.goToProfile(this.props.profile.PublicKeyBase58Check, this.props.profile.Username)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={notificationsStyles.centerTextVertically}
                    onPress={() => this.props.goToProfile(this.props.profile.PublicKeyBase58Check, this.props.profile.Username)}
                    activeOpacity={1}>
                    <Image style={notificationsStyles.profilePic} source={{ uri: this.props.profile.ProfilePic }} />
                </TouchableOpacity>

                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#00803c' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="dollar" size={14} color="white" />
                </View>

                <View style={notificationsStyles.textContainer}>
                    <TouchableOpacity
                        style={notificationsStyles.centerTextVertically}
                        onPress={() => this.props.goToProfile(this.props.profile.PublicKeyBase58Check, this.props.profile.Username)}
                        activeOpacity={1}>
                        <Text style={[notificationsStyles.usernameText, themeStyles.fontColorMain]}>{this.props.profile.Username} </Text>
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>bought </Text>
                    <Text style={[notificationsStyles.usernameText, themeStyles.fontColorMain]}>~${usd} </Text>
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}>worth of your coin</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
