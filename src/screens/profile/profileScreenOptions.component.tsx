import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';
import { Feather } from '@expo/vector-icons';
import { api, cache, snackbar } from '@services';
import { ChangeFollowersEvent, EventType, User } from '@types';
import { eventManager, globals } from '@globals';
import { themeStyles } from '@styles';
import Clipboard from 'expo-clipboard';
import { signing } from '@services/authorization/signing';
import NotificationSubscriptionComponent from '@screens/profile/notificationSubscription.component';
import CloudFeedButton from '@components/cloutfeedButton.component'

export function ProfileScreenOptionsComponent(
    { publicKey, goToChat, username }: { publicKey: string, goToChat: () => void, username: string }
) {
    const navigation = useNavigation();

    const [isFollowed, setIsFollowed] = useState<boolean | undefined>(undefined);
    const [followButtonColor, setFollowButtonColor] = useState<string>('black');

    let isMounted = true;

    useEffect(
        () => {
            cache.user.getData().then(
                p_response => checkIsFollowed(p_response)
            ).catch();

            return () => {
                isMounted = false;
            };
        },
        []
    );

    function checkIsFollowed(p_user: User) {
        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];

        const followed = followedByUserPublicKeys?.indexOf(publicKey);
        if (isMounted) {
            setIsFollowed(followed !== -1);
        }
    }

    function onFollowButtonClick() {
        if (isFollowed === undefined) {
            return;
        }

        setFollowButtonColor(themeStyles.buttonDisabledColor.backgroundColor);

        api.createFollow(globals.user.publicKey, publicKey, isFollowed).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;

                const signedTransactionHex = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransactionHex as string);

                if (isMounted) {
                    const event: ChangeFollowersEvent = {
                        publicKey: publicKey
                    };

                    if (isFollowed) {
                        eventManager.dispatchEvent(EventType.DecreaseFollowers, event);
                    } else {
                        eventManager.dispatchEvent(EventType.IncreaseFollowers, event);
                    }

                    setIsFollowed((p_previousValue: boolean | undefined) => !p_previousValue);
                }

                if (isFollowed) {
                    cache.removeFollower(publicKey);
                } else {
                    cache.addFollower(publicKey);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(() => setFollowButtonColor('black'));
    }

    async function onProfileOptionsClick() {
        const user = await cache.user.getData();
        const isUserBlocked = user?.BlockedPubKeys && !!user.BlockedPubKeys[publicKey];
        const blockOptionText = isUserBlocked ? 'Unblock User' : 'Block User';

        const options = ['Open in Browser', 'Copy Public Key', blockOptionText, 'Cancel'];

        const callback = async (p_optionIndex: number) => {
            switch (p_optionIndex) {
                case 0:
                    Linking.openURL(`https://bitclout.com/u/${username}`);
                    break;
                case 1:
                    Clipboard.setString(publicKey);
                    snackbar.showSnackBar(
                        {
                            text: 'Public key copied to clipboard.'
                        }
                    );
                    return;
                case 2:
                    const jwt = await signing.signJWT();
                    api.blockUser(globals.user.publicKey, publicKey, jwt as string, isUserBlocked).then(
                        async () => {
                            try {
                                const blockedText = isUserBlocked ? 'unblocked' : 'blocked';
                                await cache.user.getData(true);
                                snackbar.showSnackBar(
                                    {
                                        text: 'User has been ' + blockedText
                                    }
                                );
                                if (!isUserBlocked) {
                                    navigation.navigate(
                                        'Home',
                                        {
                                            blockedUser: publicKey
                                        }
                                    );
                                }
                            } catch {
                                Alert.alert('Error', 'Something went wrong! Please try again.');
                            }
                        }
                    ).catch(p_error => globals.defaultHandleError(p_error));
                    return;
            }
        }
        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [2] }
            }
        );
    }

    return <View style={styles.container}>
        <NotificationSubscriptionComponent publicKey={publicKey} />
        <CloudFeedButton
            disabled={followButtonColor !== 'black'}
            title={isFollowed ? 'Unfollow' : 'Follow'}
            onPress={onFollowButtonClick}
            styles={styles.followButton}
        />
        <CloudFeedButton
            disabled={false}
            title={'Message'}
            onPress={goToChat}
            styles={styles.followButton}
        />
        <TouchableOpacity
            activeOpacity={1}
            onPress={onProfileOptionsClick}
        >
            <Feather name="more-horizontal" size={24} color={themeStyles.fontColorMain.color} />
        </TouchableOpacity>
    </View>
}
const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: 10,
        },
        followButton: {
            marginRight: 10,
        },
    }
);
