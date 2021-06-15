import React from "react";
import { View, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { Ionicons, Fontisto, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from "@react-navigation/native";
import { Post } from '@types';
import { globals } from "@globals/globals";
import { diamondAnimation } from "@services/diamondAnimation";
import { api } from "@services/api";
import { signing } from "@services/authorization/signing";
import { themeStyles } from "@styles/globalColors";

interface Props {
    navigation: NavigationProp<any>;
    post: Post;
    actionsDisabled?: boolean;
}

interface State {
    likeIcon: any;
    diamondLevel: number;
}

export class PostActionsRow extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            likeIcon: this.getLikeIcon(),
            diamondLevel: this.props.post.PostEntryReaderState.DiamondLevelBestowed
        };

        this.onLike = this.onLike.bind(this);
        this.onSendDiamonds = this.onSendDiamonds.bind(this);
        this.goToReply = this.goToReply.bind(this);
        this.goToReclout = this.goToReclout.bind(this);
        this.goToStats = this.goToStats.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return this.props.post.PostHashHex !== p_nextProps.post.PostHashHex ||
            this.state.likeIcon.name !== p_nextState.likeIcon.name ||
            this.state.diamondLevel !== p_nextState.diamondLevel;
    }

    private getLikeIcon = () => {
        const icon = this.props.post.PostEntryReaderState?.LikedByReader ? { name: 'ios-heart-sharp', color: '#eb1b0c' } : { name: 'ios-heart-outline', color: '#a1a1a1' };
        return icon;
    }

    private async onLike() {
        const post = this.props.post;

        if (this.props.actionsDisabled) {
            return;
        }

        if (!post.PostEntryReaderState) {
            return;
        }

        let originalLikedByReader = post.PostEntryReaderState.LikedByReader;
        post.PostEntryReaderState.LikedByReader = !originalLikedByReader;
        if (post.PostEntryReaderState.LikedByReader) {
            post.LikeCount++
        } else {
            post.LikeCount--;
        }

        if (this._isMounted) {
            this.setState({ likeIcon: this.getLikeIcon() });
        }

        try {
            const response = await api.likePost(globals.user.publicKey, post.PostHashHex, originalLikedByReader);
            const transactionHex = response.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex as string);

        } catch {
            post.PostEntryReaderState.LikedByReader = originalLikedByReader;
            if (post.PostEntryReaderState.LikedByReader) {
                post.LikeCount++
            } else {
                post.LikeCount--;
            }

            if (this._isMounted) {
                this.setState({ likeIcon: this.getLikeIcon() });
            }
        }
    }

    private async onSendDiamonds() {
        const post = this.props.post;

        if (this.props.actionsDisabled || !post.PostEntryReaderState || post.PostEntryReaderState.DiamondLevelBestowed > 0) {
            return;
        }

        if (globals.user.publicKey === post.ProfileEntryResponse?.PublicKeyBase58Check) {
            Alert.alert('Error', 'You cannot diamond your own posts.');
            return;
        }
        diamondAnimation.show();

        post.PostEntryReaderState.DiamondLevelBestowed = 1;
        post.DiamondCount++;

        this.setState({ diamondLevel: 1 });

        try {
            const response = await api.sendDiamonds(globals.user.publicKey, post.ProfileEntryResponse.PublicKeyBase58Check, post.PostHashHex);
            const transactionHex = response.TransactionHex;

            const signedTransactionHex = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex as string);

        } catch {
            post.PostEntryReaderState.DiamondLevelBestowed = 0;
            post.DiamondCount--;
            this.setState({ diamondLevel: 0 });
        }
    }

    private goToReply() {
        if (this.props.actionsDisabled) {
            return;
        }

        this.props.navigation.navigate(
            'CreatePost',
            {
                parentPost: this.props.post,
                comment: true
            }
        );
    }

    private goToReclout() {
        if (this.props.actionsDisabled) {
            return;
        }

        this.props.navigation.navigate(
            'CreatePost',
            {
                recloutedPost: this.props.post,
                reclout: true
            }
        );
    }

    private goToStats(p_selectedTab: string) {
        (this.props.navigation as any).push(
            'PostStats',
            {
                postHashHex: this.props.post.PostHashHex,
                selectedTab: p_selectedTab
            }
        );
    }

    render() {
        return <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.onLike} onLongPress={() => this.goToStats('Likes')}>
                <Ionicons name={this.state.likeIcon.name as any} size={24} color={this.state.likeIcon.color} />
                <Text style={styles.actionText}>{this.props.post.LikeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.goToReply}>
                <Fontisto name='comment' size={19} color={'#a1a1a1'} />
                <Text style={styles.actionText}>{this.props.post.CommentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.goToReclout} onLongPress={() => this.goToStats('Reclouts')}>
                <MaterialCommunityIcons name="twitter-retweet" size={28} color={this.props.post.PostEntryReaderState?.RecloutedByReader ? '#5ba358' : '#a1a1a1'} />
                <Text style={styles.actionText}>{this.props.post.RecloutCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.5} onPress={this.onSendDiamonds} onLongPress={() => this.goToStats('Diamonds')}>
                <FontAwesome name="diamond" size={18} color={this.state.diamondLevel != null && this.state.diamondLevel > 0 ? themeStyles.diamondColor.color : '#a1a1a1'} />
                <Text style={styles.actionText}>{this.props.post.DiamondCount}</Text>
            </TouchableOpacity>
        </View>
    }
}

const styles = StyleSheet.create(
    {
        actionsContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 14,
            marginLeft: 10
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
    }
);