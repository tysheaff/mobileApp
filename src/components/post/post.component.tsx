import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { Post } from '@types';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { ImageGalleryComponent } from '../imageGallery.component';
import { TextWithLinks } from '../textWithLinks.component';
import { globals, hapticsManager } from '@globals';
import { calculateAndFormatBitCloutInUsd, calculateDurationUntilNow } from '@services';
import { themeStyles } from '@styles';
import { PostOptionsComponent } from './postOptions.components';
import { PostActionsRow } from './postActionsRow.component';
import CloutFeedVideoComponent from '@components/post/cloutFeedVideo.component';
import { StackNavigationProp } from '@react-navigation/stack';
import ProfileInfoImageComponent from '@components/profileInfo/profileInfoImage.component';
import ProfileInfoUsernameComponent from '@components/profileInfo/profileInfoUsername.component';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<ParamListBase, string>;
    post: Post,
    disablePostNavigate?: boolean,
    disableProfileNavigation?: boolean,
    actionsDisabled?: boolean,
    hideBottomBorder?: boolean,
    recloutedPostIndex?: number,
    isParentPost?: boolean;
    isPinned?: boolean;
}

interface State {
    coinPrice: string;
    durationUntilNow: string;
    actionsDisabled: boolean;
    isHeartShowed: boolean;
}

export class PostComponent extends React.Component<Props, State> {

    private _animation = new Animated.Value(0);

    private _inputRange = [0, 1.3];

    private _outputRange = [0, 1.3];

    private scale = this._animation.interpolate({
        inputRange: this._inputRange,
        outputRange: this._outputRange
    });

    constructor(p_props: Props) {
        super(p_props);

        const coinPrice = calculateAndFormatBitCloutInUsd(this.props.post.ProfileEntryResponse.CoinPriceBitCloutNanos);
        const durationUntilNow = calculateDurationUntilNow(this.props.post.TimestampNanos);

        this.state = {
            coinPrice,
            durationUntilNow,
            actionsDisabled: this.props.actionsDisabled || globals.readonly,
            isHeartShowed: false
        };

        if (this.props.post.ImageURLs?.length > 0) {
            const imageUrls: string[] = [];

            for (const imageUrl of this.props.post.ImageURLs) {
                if (imageUrl.startsWith('https://images.bitclout.com/') || imageUrl.startsWith('https://arweave.net/')) {
                    imageUrls.push(imageUrl);
                } else if (imageUrl.startsWith('https://i.imgur.com')) {
                    const mappedImage = imageUrl.replace('https://i.imgur.com', 'https://images.bitclout.com/i.imgur.com');
                    imageUrls.push(mappedImage);
                }
            }

            this.props.post.ImageURLs = imageUrls;
        }

        this.goToStats = this.goToStats.bind(this);
        this.goToPost = this.goToPost.bind(this);
        this.goToRecloutedPost = this.goToRecloutedPost.bind(this);
        this.getEmbeddedVideoLink = this.getEmbeddedVideoLink.bind(this);
        this.toggleHeartIcon = this.toggleHeartIcon.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State): boolean {
        return this.props.post.PostHashHex !== p_nextProps.post.PostHashHex
            || this.state.isHeartShowed !== p_nextState.isHeartShowed;
    }

    private goToStats(): void {
        this.props.navigation.push(
            'PostStatsTabNavigator',
            {
                postHashHex: this.props.post.PostHashHex
            }
        );

        hapticsManager.customizedImpact();
    }

    private goToPost(): void {
        if (this.props.disablePostNavigate !== true) {
            this.props.navigation.push(
                'Post',
                {
                    postHashHex: this.props.post.PostHashHex,
                    key: 'Post_' + this.props.post.PostHashHex
                }
            );
        }
    }

    private goToRecloutedPost(): void {
        if (this.props.disablePostNavigate !== true) {
            this.props.navigation.push(
                'Post',
                {
                    postHashHex: this.props.post.RecloutedPostEntryResponse.PostHashHex,
                    key: 'Post_' + this.props.post.RecloutedPostEntryResponse.PostHashHex
                }
            );
        }
    }

    public getEmbeddedVideoLink(p_videoLink: string): string {
        const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const youtubeMatch = p_videoLink.match(youtubeRegExp);
        if (youtubeMatch && youtubeMatch[7].length == 11) {
            const videoId = youtubeMatch[7];
            const videoLink = 'https://www.youtube.com/embed/' + videoId;
            return videoLink;
        }

        return p_videoLink;
    }

    private scaleIn(): void {
        this.setState({ isHeartShowed: true });
        Animated.spring(this._animation, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }

    private scaleOut(): void {
        Animated.spring(this._animation, {
            toValue: 0,
            useNativeDriver: true,
        }).start(() => this.setState({ isHeartShowed: false }));
    }

    private toggleHeartIcon(): void {
        this.scaleIn();
        setTimeout(
            () => {
                this.scaleOut();
            },
            750
        );
    }

    render(): JSX.Element {
        const bodyText = this.props.post.Body?.trimEnd();

        return (
            <View style={this.props.isParentPost ? [
                styles.parentPostContainer,
                styles.containerVerticalPaddings,
                themeStyles.containerColorMain,
                themeStyles.borderColor] : [
                themeStyles.containerColorMain,
                themeStyles.borderColor]}>
                {
                    this.props.isParentPost &&
                    <View style={styles.parentPostSubContainer}>
                        <ProfileInfoImageComponent
                            imageSize={35}
                            profile={this.props.post.ProfileEntryResponse}
                            navigation={this.props.navigation}
                        />
                        <View style={[styles.parentConnector, themeStyles.recloutBorderColor]} />
                    </View>
                }
                <View style={this.props.isParentPost ? styles.isParentPostContainer : {}}>
                    <View
                        style={[
                            styles.contentContainer,
                            !this.props.isParentPost ? styles.containerVerticalPaddings : {},
                            { borderBottomWidth: this.props.hideBottomBorder ? 0 : 1 },
                            themeStyles.borderColor
                        ]}>
                        <TouchableOpacity onPress={() => this.goToPost()} onLongPress={() => this.goToStats()} activeOpacity={1}>
                            <View style={styles.headerContainer} >
                                {
                                    !this.props.isParentPost && (
                                        <ProfileInfoImageComponent
                                            imageSize={35}
                                            profile={this.props.post.ProfileEntryResponse}
                                            navigation={this.props.navigation}
                                        />
                                    )
                                }
                                <View>
                                    <ProfileInfoUsernameComponent
                                        profile={this.props.post.ProfileEntryResponse}
                                        navigation={this.props.navigation}
                                    />

                                    <TouchableOpacity style={styles.actionButton} activeOpacity={1}>
                                        <Ionicons name="ios-time-outline" size={14} color="#a1a1a1" />
                                        <Text style={styles.actionText}>{this.state.durationUntilNow}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.headerRightContainer}>
                                    {
                                        this.props.isPinned &&
                                        <Entypo style={styles.pinIcon} name="pin" size={16} color={themeStyles.fontColorMain.color} />
                                    }

                                    <View style={[styles.coinPriceContainer, themeStyles.chipColor]}>
                                        <Text style={[styles.coinPriceText, themeStyles.fontColorMain]}>
                                            ${this.state.coinPrice}
                                        </Text>
                                    </View>

                                    {
                                        !this.state.actionsDisabled &&
                                        <PostOptionsComponent navigation={this.props.navigation} route={this.props.route} post={this.props.post} />
                                    }
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => this.goToPost()} onLongPress={() => this.goToStats()} activeOpacity={1}>
                            <TextWithLinks
                                navigation={this.props.navigation}
                                numberOfLines={bodyText?.length > 280 ? 9 : 16}
                                style={[styles.bodyText, themeStyles.fontColorMain]}
                                text={bodyText}
                            />
                        </TouchableOpacity>

                        {
                            this.props.post.ImageURLs?.length > 0 &&
                            <ImageGalleryComponent
                                removable={false}
                                onRemove={() => undefined}
                                imageUrls={this.props.post.ImageURLs}
                                goToStats={() => this.goToStats()}
                            />
                        }

                        {
                            this.props.post.PostExtraData?.EmbedVideoURL &&
                            <CloutFeedVideoComponent embeddedVideoLink={this.props.post.PostExtraData?.EmbedVideoURL} />
                        }

                        {
                            this.props.post.RecloutedPostEntryResponse && (this.props.recloutedPostIndex == null || this.props.recloutedPostIndex < 2) &&
                            <View style={[styles.recloutedPostContainer, themeStyles.recloutBorderColor]}>
                                <TouchableOpacity onPress={() => this.goToRecloutedPost()} activeOpacity={1}>
                                    <PostComponent
                                        navigation={this.props.navigation}
                                        route={this.props.route}
                                        post={this.props.post.RecloutedPostEntryResponse}
                                        hideBottomBorder={true}
                                        recloutedPostIndex={this.props.recloutedPostIndex == null ? 1 : this.props.recloutedPostIndex + 1}
                                    />
                                </TouchableOpacity>
                            </View>

                        }
                        {
                            this.props.post.Body || this.props.post.ImageURLs?.length > 0 ?
                                <PostActionsRow
                                    toggleHeartIcon={() => this.toggleHeartIcon()}
                                    navigation={this.props.navigation}
                                    post={this.props.post}
                                    actionsDisabled={this.props.actionsDisabled} />
                                : undefined
                        }
                    </View >
                </View>

                {
                    this.state.isHeartShowed &&
                    <Animated.View style={[styles.floatingHeart, { transform: [{ scale: this.scale }] }]} >
                        <Ionicons
                            name={'ios-heart-sharp'}
                            size={75}
                            color={'#eb1b0c'}
                        />
                    </Animated.View>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create(
    {
        containerVerticalPaddings: {
            paddingTop: 24,
            paddingBottom: 10
        },
        parentPostContainer: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center'
        },
        parentPostSubContainer: {
            flex: 1,
            paddingLeft: 10
        },
        isParentPostContainer: {
            flex: 11
        },
        parentConnector: {
            borderRightWidth: 2,
            borderStyle: 'solid',
            width: '55%',
            height: '100%'
        },
        contentContainer: {
            flex: 1,
            width: '100%'
        },

        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
            paddingHorizontal: 10
        },
        headerRightContainer: {
            flexDirection: 'row',
            marginLeft: 'auto'
        },
        bodyText: {
            fontSize: 15,
            paddingHorizontal: 10,
            marginBottom: 10
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 10,
            marginTop: 2,
        },
        actionText: {
            marginLeft: 4,
            color: '#a1a1a1',
            fontSize: 12
        },
        coinPriceContainer: {
            borderRadius: 12,
            paddingHorizontal: 10,
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
            marginHorizontal: 10,
            borderWidth: 1,
            padding: 10,
            paddingBottom: 4,
            borderRadius: 8,
            marginTop: 10
        },
        floatingHeart: {
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center'
        },
        pinIcon: {
            marginRight: 6
        }
    }
);
