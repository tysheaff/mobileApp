import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { Post } from '../../types';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageGalleryComponent } from '../imageGallery.component';
import { TextWithLinks } from '../textWithLinks.component';
import { globals } from '@globals';
import { api, calculateAndFormatBitCloutInUsd, calculateDurationUntilNow, diamondAnimation } from '@services';
import { themeStyles } from '@styles';
import { parseVideoLink } from '@services/videoLinkParser';
import { PostOptionsComponent } from './postOptions.components';
import { PostActionsRow } from './postActionsRow.component';

interface Props {
    navigation: NavigationProp<any>;
    route: any;
    post: Post,
    disablePostNavigate?: boolean,
    disableProfileNavigation?: boolean,
    actionsDisabled?: boolean,
    hideBottomBorder?: boolean,
    recloutedPostIndex?: number,
    isParentPost?: boolean
}

interface State {
    coinPrice: string;
    durationUntilNow: string;
    actionsDisabled: boolean;
    profilePic: string;
}

export class PostComponent extends React.Component<Props, State> {

    private _mount = true;

    constructor(p_props: Props) {
        super(p_props);

        const coinPrice = calculateAndFormatBitCloutInUsd(this.props.post.ProfileEntryResponse.CoinPriceBitCloutNanos);
        const durationUntilNow = calculateDurationUntilNow(this.props.post.TimestampNanos);

        this.state = {
            coinPrice,
            durationUntilNow,
            actionsDisabled: this.props.actionsDisabled || globals.readonly,
            profilePic: api.getSingleProfileImage(this.props.post.ProfileEntryResponse.PublicKeyBase58Check)
        };

        this.goToProfile = this.goToProfile.bind(this);
        this.goToPost = this.goToPost.bind(this);
        this.goToRecloutedPost = this.goToRecloutedPost.bind(this);
        this.getEmbeddedVideoLink = this.getEmbeddedVideoLink.bind(this);
    }

    componentWillUnmount() {
        this._mount = false;
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.post.PostHashHex !== p_nextProps.post.PostHashHex;
    }

    private goToProfile() {
        if (!this.props.disableProfileNavigation) {
            (this.props.navigation as any).push(
                'UserProfile',
                {
                    publicKey: this.props.post.ProfileEntryResponse.PublicKeyBase58Check,
                    username: this.props.post.ProfileEntryResponse.Username,
                    key: 'Profile_' + this.props.post.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    private goToPost() {
        if (this.props.disablePostNavigate !== true) {
            (this.props.navigation as any).push(
                'Post',
                {
                    postHashHex: this.props.post.PostHashHex,
                    key: 'Post_' + this.props.post.PostHashHex
                }
            );
        }
    }

    private goToRecloutedPost() {
        if (this.props.disablePostNavigate !== true) {
            (this.props.navigation as any).push(
                'Post',
                {
                    postHashHex: this.props.post.RecloutedPostEntryResponse.PostHashHex,
                    key: 'Post_' + this.props.post.RecloutedPostEntryResponse.PostHashHex
                }
            );
        }
    }

    public getEmbeddedVideoLink(p_videoLink: string) {
        const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const youtubeMatch = p_videoLink.match(youtubeRegExp);
        if (youtubeMatch && youtubeMatch[7].length == 11) {
            const videoId = youtubeMatch[7]
            const videoLink = 'https://www.youtube.com/embed/' + videoId;
            return videoLink;
        }

        return p_videoLink;
    }

    render() {
        const embeddedVideoLink: any = this.props.post.PostExtraData?.EmbedVideoURL ? parseVideoLink(this.props.post.PostExtraData?.EmbedVideoURL) : undefined;
        return (
            <View style={this.props.isParentPost ? [
                styles.parentPostContainer,
                styles.containerVerticalPaddings,
                themeStyles.containerColorMain,
                themeStyles.borderColor] : [
                themeStyles.containerColorMain,
                themeStyles.borderColor]}>
                {
                    this.props.isParentPost ?
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                            <TouchableOpacity activeOpacity={1} onPress={this.goToProfile}>
                                <Image style={styles.profilePic} source={{ uri: this.state.profilePic }}></Image>
                            </TouchableOpacity>
                            <View style={[styles.parentConnector, themeStyles.recloutBorderColor]} />
                        </View> : undefined
                }
                <View style={this.props.isParentPost ? { flex: 11 } : {}}>
                    <View
                        style={[
                            styles.contentContainer,
                            !this.props.isParentPost ? styles.containerVerticalPaddings : {},
                            { borderBottomWidth: this.props.hideBottomBorder ? 0 : 1 },
                            themeStyles.borderColor
                        ]}>
                        <TouchableOpacity onPress={this.goToPost} activeOpacity={1}>
                            <View style={styles.headerContainer}>
                                {
                                    !this.props.isParentPost ? (
                                        <TouchableOpacity activeOpacity={1} onPress={this.goToProfile}>
                                            <Image style={styles.profilePic} source={{ uri: this.state.profilePic }}></Image>
                                        </TouchableOpacity>
                                    ) : undefined
                                }
                                <View>
                                    <TouchableOpacity style={styles.usernameContainer} activeOpacity={1} onPress={this.goToProfile}>
                                        <Text style={[styles.username, themeStyles.fontColorMain]} >{this.props.post.ProfileEntryResponse?.Username}</Text>
                                        {
                                            this.props.post.ProfileEntryResponse?.IsVerified ?
                                                <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                                        }
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionButton} activeOpacity={1}>
                                        <Ionicons name="ios-time-outline" size={14} color="#a1a1a1" />
                                        <Text style={styles.actionText}>{this.state.durationUntilNow}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.headerRightContainer}>
                                    <View style={[styles.coinPriceContainer, themeStyles.chipColor]}>
                                        <Text style={[styles.coinPriceText, themeStyles.fontColorMain]}>
                                            ${this.state.coinPrice}
                                        </Text>
                                    </View>

                                    {
                                        !this.state.actionsDisabled ?
                                            <PostOptionsComponent navigation={this.props.navigation} route={this.props.route} post={this.props.post} />
                                            :
                                            undefined
                                    }
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={this.goToPost} activeOpacity={1}>
                            <TextWithLinks style={[styles.bodyText, themeStyles.fontColorMain]} text={this.props.post.Body?.trimEnd()}></TextWithLinks>
                        </TouchableOpacity>

                        {
                            this.props.post.ImageURLs?.length > 0 ?
                                <ImageGalleryComponent imageUrls={this.props.post.ImageURLs} goToPost={this.goToPost}></ImageGalleryComponent> :
                                undefined
                        }

                        {
                            embeddedVideoLink ?
                                <WebView
                                    style={[styles.videoContainer, themeStyles.containerColorMain]}
                                    source={{ uri: embeddedVideoLink }}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                ></WebView>
                                :
                                undefined
                        }

                        {
                            this.props.post.RecloutedPostEntryResponse && (this.props.recloutedPostIndex == null || this.props.recloutedPostIndex < 2) ?
                                <View style={[styles.recloutedPostContainer, themeStyles.recloutBorderColor]}>
                                    <TouchableOpacity onPress={this.goToRecloutedPost} activeOpacity={1}>
                                        <PostComponent
                                            navigation={this.props.navigation}
                                            route={this.props.route}
                                            post={this.props.post.RecloutedPostEntryResponse}
                                            hideBottomBorder={true}
                                            recloutedPostIndex={this.props.recloutedPostIndex == null ? 1 : this.props.recloutedPostIndex + 1}
                                        ></PostComponent>
                                    </TouchableOpacity>
                                </View>
                                :
                                undefined
                        }
                        {
                            this.props.post.Body || this.props.post.ImageURLs?.length > 0 ?
                                <PostActionsRow
                                    navigation={this.props.navigation}
                                    post={this.props.post}
                                    actionsDisabled={this.props.actionsDisabled} />
                                : undefined
                        }
                    </View >
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create(
    {
        containerVerticalPaddings: {
            paddingTop: 24,
            paddingBottom: 10,
        },
        parentPostContainer: {
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center'
        },
        parentConnector: {
            borderRightWidth: 2,
            borderStyle: 'solid',
            width: '55%',
            height: '100%'
        },
        contentContainer: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        },
        profilePic: {
            width: 35,
            height: 35,
            borderRadius: 8,
            marginRight: 10
        },
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
            paddingLeft: 10,
            paddingRight: 10
        },
        headerRightContainer: {
            display: 'flex',
            flexDirection: 'row',
            marginLeft: 'auto'
        },
        bodyText: {
            fontSize: 15,
            paddingLeft: 10,
            paddingRight: 10
        },
        usernameContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: 'bold',
            maxWidth: Dimensions.get('window').width / 2 + 20,
            marginBottom: 2,
            marginRight: 6
        },
        actionButton: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 10,
            flex: 1
        },
        actionText: {
            marginLeft: 4,
            color: '#a1a1a1',
            fontSize: 12
        },
        coinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            marginBottom: 6,
            justifyContent: 'center',
            height: 20,
            marginRight: 12
        },
        coinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        recloutedPostContainer: {
            marginLeft: 10,
            marginRight: 10,
            borderWidth: 1,
            padding: 10,
            paddingBottom: 4,
            borderRadius: 8,
            marginTop: 10
        },
        link: {
            fontWeight: '500'
        },
        videoContainer: {
            opacity: 0.99,
            height: 400,
            width: '100%'
        }
    }
);