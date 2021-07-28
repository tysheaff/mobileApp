import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';
import { notificationsStyles } from '../styles/notificationStyles';

interface Props {
    goToProfile: (p_userKey: string, p_username: string) => void;
    notification: Notification;
    profile: any;
}

export class FollowNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                activeOpacity={1}>
                <TouchableOpacity
                    style={notificationsStyles.centerTextVertically}
                    onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                    activeOpacity={1}>
                    <ProfileInfoImageComponent publicKey={this.props.profile?.PublicKeyBase58Check} />
                </TouchableOpacity>
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#0377fc' }]}>
                    <MaterialCommunityIcons style={[{ marginLeft: 1 }]} name="account" size={15} color="white" />
                </View>
                <View style={notificationsStyles.textContainer}>
                    <TouchableOpacity
                        style={notificationsStyles.centerTextVertically}
                        onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                        activeOpacity={1}>
                        <ProfileInfoUsernameComponent
                            username={this.props.profile?.Username}
                            verified={this.props.profile?.IsVerified}
                        />
                    </TouchableOpacity>

                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> {this.props.notification.Metadata.FollowTxindexMetadata?.IsUnfollow ? 'unfollowed' : 'followed'} you</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
