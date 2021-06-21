import React from "react";
import { Alert, Linking, TouchableOpacity } from "react-native";
import { Feather } from '@expo/vector-icons';
import { EventType, Post } from '@types';
import { globals } from "@globals/globals";
import { signing } from "@services/authorization/signing";
import { api } from "@services";
import { eventManager } from "@globals/injector";
import Clipboard from 'expo-clipboard';
import { snackbar } from "@services/snackbar";
import { NavigationProp } from "@react-navigation/native";

interface Props {
    navigation: NavigationProp<any>;
    route: any;
    post: Post;
}

export class PostOptionsComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.onPostOptionsClick = this.onPostOptionsClick.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.post?.PostHashHex !== this.props.post?.PostHashHex;
    }

    private onPostOptionsClick() {
        if (globals.user.publicKey !== this.props.post.ProfileEntryResponse.PublicKeyBase58Check) {
            this.showNotOwnPostOptions();
        } else {
            this.showOwnPostOptions();
        }
    }

    private showNotOwnPostOptions() {
        const options = ['Copy Link', 'Copy Text', 'Report', 'Block User', 'Cancel'];

        const callback = async (p_optionIndex: number) => {
            switch (p_optionIndex) {
                case 0:
                    return this.copyToClipBoard(true);
                case 1:
                    return this.copyToClipBoard(false);
                case 2:
                    return Linking.openURL(`https://report.bitclout.com/?ReporterPublicKey=${globals.user.publicKey}&PostHash=${this.props.post.PostHashHex}`);
                case 3:
                    const jwt = await signing.signJWT();

                    api.blockUser(globals.user.publicKey, this.props.post.ProfileEntryResponse.PublicKeyBase58Check, jwt as string, false).then(
                        () => this.props.navigation.navigate(
                            'Home',
                            {
                                blockedUser: this.props.post.ProfileEntryResponse.PublicKeyBase58Check
                            }
                        )
                    ).catch(() => Alert.alert('Error', 'Something went wrong! Please try again.'));
            }
        };

        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [2, 3] }
            }
        );
    }

    private showOwnPostOptions() {
        const options = ['Copy Link', 'Copy Text', 'Edit', 'Delete Post', 'Cancel'];

        const callback = (p_optionIndex: number) => {
            switch (p_optionIndex) {
                case 0:
                    return this.copyToClipBoard(true);
                case 1:
                    return this.copyToClipBoard(false);
                case 2:
                    if (this.props.post.Body || this.props.post.ImageURLs?.length > 0) {
                        this.props.navigation.navigate(
                            'CreatePost',
                            {
                                editPost: true,
                                editedPost: this.props.post
                            }
                        );
                    } else {
                        Alert.alert('Sorry!', 'You cannot edit a reclout, if it does not include a quote.');
                    }
                case 3:
                    api.hidePost(
                        globals.user.publicKey,
                        this.props.post.PostHashHex,
                        this.props.post.Body,
                        this.props.post.ImageURLs,
                        this.props.post.RecloutedPostEntryResponse?.PostHashHex
                    ).then(
                        async p_response => {
                            const transactionHex = p_response.TransactionHex;

                            const signedTransactionHex = await signing.signTransaction(transactionHex);
                            await api.submitTransaction(signedTransactionHex as string);

                            if (this.props.route.name === 'Home' || this.props.route.name === 'Profile') {
                                Alert.alert('Success', 'Your post was deleted successfully.');
                                this.props.navigation.navigate(
                                    this.props.route.name,
                                    {
                                        deletedPost: this.props.post.PostHashHex
                                    }
                                );

                            } else {
                                Alert.alert('Success', 'Your post was deleted successfully. Please reload the screen to see this change.');
                            }
                        }
                    ).catch(p_error => globals.defaultHandleError(p_error));
            }
        }

        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [3] }
            }
        );
    }

    private copyToClipBoard(p_isLink: boolean) {
        let text: string = p_isLink ? 'Link copied to clipboard' : 'Text copied to clipboard';
        const postLink = p_isLink ? `https://bitclout.com/posts/${this.props.post.PostHashHex}` : this.props.post.Body
        Clipboard.setString(postLink);
        snackbar.showSnackBar({ text });
    }

    render() {
        return <TouchableOpacity activeOpacity={1} onPress={this.onPostOptionsClick}>
            <Feather name="more-horizontal" size={20} color="#a1a1a1" />
        </TouchableOpacity>
    }
}