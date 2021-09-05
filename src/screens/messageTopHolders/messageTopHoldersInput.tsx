import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, Keyboard, Dimensions, ActivityIndicator } from 'react-native';
import { ScrollView, TextInput, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { CreatorCoinHODLer, EventType, Profile } from '@types';
import { eventManager, globals, settingsGlobals } from '@globals';
import { api, cache, promiseHelper } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';

type Route = {
    route: {
        params: {
            count: number;
        }
    }
};

export function MessageTopHoldersInputScreen({ route }: Route) {

    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const [isLoading, setLoading] = useState(true);
    const [isSending, setSending] = useState(false);
    const [profile, setProfile] = useState({} as Profile);
    const [receiversCount, setReceiversCount] = useState(0);
    const [alreadyReceivedCount, setAlreadyReceivedCount] = useState(0);

    const relevantHolders = useRef<string[]>([]);
    const messageText = useRef<string>('');
    const isMounted = useRef<boolean>(true);

    useEffect(
        () => {

            Promise.all([
                cache.user.getData(),
                api.getProfileHolders(globals.user.username, 0, '', true)
            ]).then(
                responses => {
                    const user = responses[0];
                    const profile = user.ProfileEntryResponse;

                    let usersWhoHODLYou: CreatorCoinHODLer[] = responses[1].Hodlers?.filter(
                        (user: CreatorCoinHODLer) => user.CreatorPublicKeyBase58Check !== user.HODLerPublicKeyBase58Check && user.HasPurchased
                    );

                    if (usersWhoHODLYou?.length > 0) {
                        const relevantHoldersCount = route.params.count === -1 ? usersWhoHODLYou.length : route.params.count;

                        usersWhoHODLYou.sort(
                            (user1, user2) => user1.BalanceNanos > user2.BalanceNanos ? -1 : 1
                        );

                        usersWhoHODLYou = usersWhoHODLYou.slice(0, relevantHoldersCount).filter(user => !!user.ProfileEntryResponse);
                        if (isMounted) {
                            setProfile(profile);
                            setLoading(false);
                            relevantHolders.current = usersWhoHODLYou.map(user => user.HODLerPublicKeyBase58Check);
                        }
                    } else {
                        alert('You do not have any coin holders!');
                        navigation.goBack();
                    }
                }
            ).catch(error => globals.defaultHandleError(error));

            const unsubscribeEvent = eventManager.addEventListener(EventType.BroadcastMessage, broadcastMessages);

            return () => {
                isMounted.current = false;
                unsubscribeEvent();
            };
        },
        []
    );

    function broadcastMessages(): void {
        if (isSending) {
            return;
        }

        broadcastMessagesInBatches();
    }

    async function broadcastMessagesInBatches(): Promise<void> {
        setSending(true);
        setReceiversCount(relevantHolders.current.length);

        if (isMounted) {
            setLoading(true);
        }

        try {
            for (const holder of relevantHolders.current) {
                try {
                    const encryptedMessage = await signing.encryptShared(holder, messageText.current);
                    await promiseHelper.retryOperation(
                        () => {
                            return new Promise<void>(
                                (resolve, reject) => {
                                    api.sendMessage(globals.user.publicKey, holder, encryptedMessage).then(
                                        async response => {
                                            const transactionHex = response.TransactionHex;
                                            const signedTransactionHex = await signing.signTransaction(transactionHex);
                                            await api.submitTransaction(signedTransactionHex);
                                            resolve();
                                        }
                                    ).catch(() => reject());
                                }
                            );
                        },
                        5000,
                        3
                    ).then(
                        () => {
                            setAlreadyReceivedCount(previous => previous + 1);
                        }
                    ).catch(() => { return; });
                }
                catch { return; }
            }

        } catch {
            alert('Something went wrong! Please try again.');
        } finally {
            goToMessages();
        }
    }

    function goToMessages(): void {
        navigation.navigate('MessageStack', { screen: 'Messages' });
    }

    return isSending ?
        <View
            style={[styles.sendingContainer, styles.container, themeStyles.containerColorMain]}
        >
            <Text style={[themeStyles.fontColorMain]}>We are broadcasting your message to your coin holders. Please do not leave this page.</Text>
            <Text style={[styles.sendingProgressText, themeStyles.fontColorMain]}>{alreadyReceivedCount}/{receiversCount}</Text>
        </View>
        :
        <ScrollView
            style={[styles.container, themeStyles.containerColorMain]}
            bounces={false}
        >
            {
                isLoading ?
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    :
                    <TouchableWithoutFeedback
                        style={styles.broadcastContainer}
                        onPress={Keyboard.dismiss}
                    >
                        <View style={styles.headerContainer}>
                            <ProfileInfoCardComponent
                                noCoinPrice={true}
                                peekDisabled={true}
                                profile={profile}
                                navigation={navigation}
                            />
                        </View>

                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain]}
                            placeholder="Share value with your coin holders..."
                            placeholderTextColor={themeStyles.fontColorSub.color}
                            multiline
                            maxLength={2048}
                            autoFocus
                            onChangeText={(text) => { messageText.current = text; }}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />

                    </TouchableWithoutFeedback>
            }
        </ScrollView>;
}

const styles = StyleSheet.create(
    {
        sendingContainer: {
            alignItems: 'center',
            paddingRight: 50,
            paddingLeft: 50,
            paddingTop: 200

        },
        sendingProgressText: {
            marginTop: 20,
            fontSize: 40,
            fontWeight: '500'

        },
        container: {
            flex: 1
        },
        activityIndicator: {
            marginTop: 175
        },
        headerContainer: {
            padding: 10
        },
        textInput: {
            marginHorizontal: 10,
            fontSize: 16,
            width: Dimensions.get('window').width - 20,
            minHeight: 50,
            marginTop: 10
        },
        broadcastContainer: {
            paddingBottom: 500
        }
    }
);
