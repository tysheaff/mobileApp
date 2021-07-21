import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Image, Dimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { constants, eventManager, globals, settingsGlobals } from '@globals';
import { themeStyles, updateThemeStyles } from '@styles';
import { SelectListControl } from '@controls/selectList.control';
import { api, cache } from '@services';
import { signing } from '@services/authorization/signing';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { ChangeFollowersEvent, EventType } from '@types';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

export enum CloutFeedTheme {
    Light = 'light',
    Dark = 'dark'
}

interface Props {
    navigation: StackNavigationProp<ParamListBase>
}

export function AppearanceScreen({ navigation }: Props) {

    const isMounted = useRef<boolean>(true);

    const [isWorking, setIsWorking] = useState<boolean>(false);
    const [selectedTheme, setSelectedTheme] = useState<CloutFeedTheme>();

    useEffect(
        () => {
            initScreen();
            return () => { isMounted.current = false; };
        },
        []
    );

    async function initScreen() {
        const key = globals.user.publicKey + constants.localStorage_appearance;
        const response = await SecureStore.getItemAsync(key).catch(() => undefined) as CloutFeedTheme;
        if (isMounted) {
            setSelectedTheme(response);
        }
    }

    async function changeTheme(p_theme: string) {
        if (selectedTheme === p_theme) {
            return;
        }

        const key = globals.user.publicKey + constants.localStorage_appearance;
        settingsGlobals.darkMode = p_theme === 'dark';

        try {
            await SecureStore.setItemAsync(key, p_theme);
            updateThemeStyles();
            globals.onLoginSuccess();
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    function openProfile() {
        const publicKey: string = constants.cloutfeed_publicKey;
        const username = 'cloutfeed';
        (navigation).push(
            'UserProfile',
            {
                publicKey,
                username,
                key: `Profile_${publicKey}`
            }
        );
    }

    async function onFollowPress() {
        if (isMounted) {
            setIsWorking(true);
        }
        try {
            const publicKey: string = constants.cloutfeed_publicKey;
            const response = await api.createFollow(globals.user.publicKey, publicKey, false);

            const transactionHex: string = response.TransactionHex;
            const signedTransactionHex: string = await signing.signTransaction(transactionHex);
            await api.submitTransaction(signedTransactionHex);

            if (isMounted) {
                const event: ChangeFollowersEvent = { publicKey };
                eventManager.dispatchEvent(EventType.IncreaseFollowers, event);
                globals.followerFeatures = true;
            }
            cache.addFollower(publicKey);

        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (isMounted) {
                setIsWorking(false);
            }
        }
    }

    return <View style={[styles.container, themeStyles.containerColorMain]}>
        {
            globals.followerFeatures
                ? <SelectListControl
                    style={[styles.selectList, themeStyles.borderColor]}
                    options={[
                        {
                            name: 'Light',
                            value: CloutFeedTheme.Light
                        },
                        {
                            name: 'Dark',
                            value: CloutFeedTheme.Dark
                        },
                    ]}
                    value={selectedTheme}
                    onValueChange={(theme: string | string[]) => changeTheme(theme as string)}
                >
                </SelectListControl>
                : <View style={styles.lockContainer} >
                    <View style={styles.iconContainer}>
                        <Image style={styles.lockImage} source={require('../../assets/lock1.png')} />
                    </View>
                    <View style={styles.lockTextContainer}>

                        <Text style={[styles.lockText, themeStyles.fontColorSub]}>
                            Follow
                            {' '}<Text onPress={openProfile} style={[themeStyles.linkColor]}>@cloutfeed</Text>{' '}
                        </Text>
                        <Text style={[styles.lockText, themeStyles.fontColorSub]}>
                            to unlock the dark mode now!
                        </Text>
                    </View>
                    <View style={styles.followBtnContainer}>
                        {
                            !globals.readonly && <CloutFeedButton
                                disabled={isWorking}
                                styles={styles.followBtn}
                                title={'Follow'}
                                onPress={onFollowPress}
                            />
                        }
                    </View>
                </View>
        }
    </View>;
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        lockContainer: {
            flex: 1,
            justifyContent: 'center'
        },
        selectList: {
            borderBottomWidth: 1
        },
        iconContainer: {
            alignItems: 'center',
        },
        lockTextContainer: {
            marginTop: 20,
            marginBottom: 30
        },
        lockText: {
            fontSize: 18,
            textAlign: 'center',
        },
        followBtnContainer: {
            marginLeft: 'auto',
            marginRight: 'auto'
        },
        lockImage: {
            width: 200,
            height: 200,
        },
        followBtn: {
            paddingVertical: 10,
            width: Dimensions.get('screen').width * 0.4
        }
    }
);
