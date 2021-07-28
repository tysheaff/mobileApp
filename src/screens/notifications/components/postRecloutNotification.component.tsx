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
    notification: Notification;
    goToProfile: (p_userKey: string, p_username: string) => void;
    goToPost: (p_postHashHex: string, p_priorityComment: undefined) => void;
    post: Post;
    postHashHex: string;
}

export class PostRecloutNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
        this.state = {
            notification: this.props.notification
        };
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => this.props.goToPost(this.props.postHashHex, undefined)}>
                <TouchableOpacity
                    style={notificationsStyles.centerTextVertically}
                    onPress={() => this.props.goToProfile(this.props.profile?.PublicKeyBase58Check, this.props.profile?.Username)}
                    activeOpacity={1}>
                    <ProfileInfoImageComponent publicKey={this.props.profile?.PublicKeyBase58Check} />
                </TouchableOpacity>
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#5ba358' }]}>
                    <FontAwesome style={{ marginLeft: 1 }} name="retweet" size={13} color="white" />
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
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> reclouted your post: </Text>
                    <Text style={[notificationsStyles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{this.props.post?.RecloutedPostEntryResponse?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
