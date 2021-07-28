import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Profile, Post, Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import { FontAwesome } from '@expo/vector-icons';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';
import { notificationsStyles } from '../styles/notificationStyles';

interface Props {
    profile: Profile;
    post: Post;
    goToProfile: (p_userKey: string, p_username: string) => void;
    goToPost: (parentPoshHashHex: string, postHashCode: string) => void;
    postHashHex: string;
    notification: Notification;
}

export class PostReplyNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        const parentPoshHashHex = this.props.notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex as string;
        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => this.props.goToPost(parentPoshHashHex, this.props.postHashHex)}>
                <TouchableOpacity
                    style={notificationsStyles.centerTextVertically}
                    onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                    activeOpacity={1}>
                    <ProfileInfoImageComponent publicKey={this.props.profile?.PublicKeyBase58Check} />
                </TouchableOpacity>
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#3599d4' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="comment" size={12} color="white" />
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
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> replied to your post: </Text>
                    <Text style={[notificationsStyles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{this.props.post?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
