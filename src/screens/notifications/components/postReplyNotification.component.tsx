import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Profile, Post, Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import { FontAwesome } from '@expo/vector-icons';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';
import { notificationsStyles } from '../styles/notificationStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    profile: Profile;
    post: Post;
    goToPost: (parentPoshHashHex: string, postHashCode: string) => void;
    postHashHex: string;
    notification: Notification;
    navigation: StackNavigationProp<ParamListBase>;
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
                <ProfileInfoImageComponent
                    navigation={this.props.navigation}
                    profile={this.props.profile}
                />
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#3599d4' }]}>
                    <FontAwesome style={[{ marginLeft: 1 }]} name="comment" size={12} color="white" />
                </View>
                <View style={notificationsStyles.textContainer}>
                    <ProfileInfoUsernameComponent
                        navigation={this.props.navigation}
                        profile={this.props.profile}
                    />
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> replied to your post: </Text>
                    <Text style={[notificationsStyles.postText, themeStyles.fontColorSub]} numberOfLines={1}>{this.props.post?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
