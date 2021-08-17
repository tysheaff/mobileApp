import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Profile, Post, Notification } from '@types';
import { globalStyles } from '@styles/globalStyles';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';
import { notificationsStyles } from '../styles/notificationStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    profile: Profile;
    goToPost: (postHashCode: string) => void;
    post: Post;
    notification: Notification;
    navigation: StackNavigationProp<ParamListBase>;
}

export class LikeNotificationComponent extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.notification?.Index !== this.props.notification?.Index;
    }

    render() {
        const postHashHex = this.props.notification.Metadata.LikeTxindexMetadata?.PostHashHex as string;
        const likedText = this.props.notification.Metadata.LikeTxindexMetadata?.IsUnlike ? 'unliked' : 'liked';
        return (
            <TouchableOpacity
                style={[notificationsStyles.notificationContainer, notificationsStyles.centerTextVertically, themeStyles.containerColorMain, themeStyles.borderColor]}
                activeOpacity={1}
                onPress={() => this.props.goToPost(postHashHex)}>
                <ProfileInfoImageComponent
                    navigation={this.props.navigation}
                    profile={this.props.profile}
                />
                <View style={[notificationsStyles.iconContainer, { backgroundColor: '#eb1b0c' }]}>
                    <Ionicons style={[{ marginLeft: 1, marginTop: 1 }]} name={'ios-heart-sharp'} size={13} color={'white'} />
                </View>
                <View style={notificationsStyles.textContainer}>

                    <ProfileInfoUsernameComponent
                        navigation={this.props.navigation}
                        profile={this.props.profile}
                    />
                    <Text style={[globalStyles.fontWeight500, themeStyles.fontColorMain]}> {likedText} your post: </Text>
                    <Text style={[[notificationsStyles.postText, themeStyles.fontColorSub]]} numberOfLines={1}>{this.props.post?.Body}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
