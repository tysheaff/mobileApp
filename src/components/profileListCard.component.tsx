import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Profile } from '../types';
import { useNavigation } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { constants, globals } from '@globals';
import { api, cache, calculateAndFormatBitCloutInUsd } from '@services';
import { signing } from '@services/authorization/signing';
import CloutFeedButton from '@components/cloutfeedButton.component';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';

export function ProfileListCardComponent({ profile, isFollowing }:
    { profile: Profile, isFollowing: boolean }) {

    const navigation = useNavigation();

    const [profileCoinPrice, setProfileCoinPrice] = useState('');
    const [working, setWorking] = useState(false);
    const [following, setFollowing] = useState(false);
    const [showFollowButton, setShowFollowButton] = useState(false);

    let mount = true;

    useEffect(
        () => {
            const coinPrice = calculateAndFormatBitCloutInUsd(profile.CoinPriceBitCloutNanos);

            if (mount) {
                setShowFollowButton(profile.PublicKeyBase58Check !== globals.user.publicKey);
                setFollowing(isFollowing);
                setProfileCoinPrice(coinPrice);
            }

            return () => {
                mount = false;
            }
        },
        []
    );

    function onFollowButtonClick() {
        setWorking(true);
        api.createFollow(globals.user.publicKey, profile.PublicKeyBase58Check, following).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;

                if (profile.PublicKeyBase58Check === constants.cloutfeed_publicKey) {
                    globals.followerFeatures = !following;
                }

                const signedTransactionHex = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransactionHex as string);

                if (mount) {
                    setFollowing((p_previous) => !p_previous);
                }

                if (following) {
                    cache.removeFollower(profile.PublicKeyBase58Check);
                } else {
                    cache.addFollower(profile.PublicKeyBase58Check);
                }
            }
        ).catch(
            p_error => globals.defaultHandleError(p_error)
        ).finally(
            () => {
                if (mount) {
                    setWorking(false)
                }
            }
        );
    }

    function goToProfile() {
        if (profile.Username !== 'anonymous') {
            (navigation as any).push('UserProfile', {
                publicKey: profile.PublicKeyBase58Check,
                username: profile.Username,
                key: 'Profile_' + profile.PublicKeyBase58Check
            });
        }
    }

    return <TouchableOpacity onPress={goToProfile} activeOpacity={1}>
        <View style={[styles.profileListCard, themeStyles.containerColorMain]}>
            <ProfileInfoCardComponent
                publicKey={profile.PublicKeyBase58Check}
                username={profile?.Username}
                coinPrice={profileCoinPrice}
                verified={profile?.IsVerified}
            />
            {
                showFollowButton && !globals.readonly ?
                    <View style={styles.followButtonContainer}>
                        <CloutFeedButton
                            disabled={working}
                            styles={styles.followBtn}
                            title={following ? 'Unfollow' : 'Follow'}
                            onPress={onFollowButtonClick}
                        />
                    </View>
                    : undefined
            }
        </View>
    </TouchableOpacity>;
}

const styles = StyleSheet.create(
    {
        profileListCard: {
            flexDirection: 'row',
            paddingVertical: 16,
            paddingHorizontal: 10,
            width: Dimensions.get('window').width,
            alignItems: 'center'
        },
        followBtn: {
            width: 90
        },
        followButtonContainer: {
            marginLeft: 'auto',
            marginTop: 6,
            marginRight: 5
        },
    }
);
