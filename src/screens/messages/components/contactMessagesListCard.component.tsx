import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ContactWithMessages } from '../../../types';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { globals } from '@globals';
import { api, calculateDurationUntilNow, getMessageText } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';
import MessageInfoCardComponent from '@components/profileInfo/messageInfoCard.component';

export function ContactMessagesListCardComponent(
    { contactWithMessages }: { contactWithMessages: ContactWithMessages }
): JSX.Element {
    const [lastMessageText, setLastMessageText] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [showCreatorCoinHolding, setShowCreatorCoinHolding] = useState<boolean>(false);
    const [unreadMessages, setUnreadMessages] = useState<boolean>(false);
    const navigation = useNavigation();
    const isMounted = useRef<boolean>(true);

    useEffect(
        () => {

            setShowCreatorCoinHolding(
                (contactWithMessages.CreatorCoinHoldingAmount as number) > 0 && globals.investorFeatures
            );
            setUnreadMessages(contactWithMessages.UnreadMessages as boolean);

            const lastMessage = contactWithMessages.Messages?.length > 0 ?
                contactWithMessages.Messages[contactWithMessages.Messages.length - 1] : undefined;

            if (lastMessage) {
                getMessageText(lastMessage).then(
                    p_text => {
                        if (isMounted) {
                            setLastMessageText(p_text);
                        }
                    }
                ).catch(() => { undefined; });

                setDuration(calculateDurationUntilNow(lastMessage.TstampNanos));
            } else {
                setLastMessageText('');
            }

            return () => {
                isMounted.current = false;
            };
        },
        []
    );

    async function goToChat() {
        if (contactWithMessages.UnreadMessages) {

            try {
                const jwt = await signing.signJWT();
                api.markContactMessagesRead(
                    globals.user.publicKey, contactWithMessages.PublicKeyBase58Check, jwt
                );
                contactWithMessages.UnreadMessages = false;
                setUnreadMessages(false);
            } catch { undefined; }
        }

        navigation.navigate(
            'MessageStack',
            {
                screen: 'Chat',
                params: {
                    contactWithMessages: contactWithMessages
                }
            }
        );
    }

    return <TouchableOpacity style={[styles.touchableContainer, themeStyles.containerColorMain, themeStyles.borderColor]} activeOpacity={0.8} onPress={goToChat}>
        <View style={styles.container}>
            <MessageInfoCardComponent
                publicKey={contactWithMessages.ProfileEntryResponse?.PublicKeyBase58Check}
                username={contactWithMessages.ProfileEntryResponse?.Username}
                lastMessage={lastMessageText}
                duration={duration}
                verified={contactWithMessages.ProfileEntryResponse?.IsVerified}
                showCreatorCoinHolding={showCreatorCoinHolding}
                isLarge={false}
            />
            {
                unreadMessages ?
                    < View style={[styles.unreadMessagesCountContainer]}>
                    </View>
                    :
                    undefined
            }
        </View>
    </TouchableOpacity >;
}

const styles = StyleSheet.create(
    {
        touchableContainer: {
            width: '100%',
            height: 65,
            borderBottomWidth: 1
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 65,
            paddingHorizontal: 10,
        },
        unreadMessagesCountContainer: {
            minWidth: 10,
            height: 10,
            borderRadius: 20,
            marginLeft: 'auto',
            marginRight: 10,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#007ef5'
        }
    }
);
