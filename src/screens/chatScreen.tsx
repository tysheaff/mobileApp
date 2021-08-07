import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, SectionList, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TextInput, KeyboardEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ContactWithMessages, Message } from '@types';
import { MessageComponent } from '@components/messageComponent';
import { globals, settingsGlobals } from '@globals';
import { api } from '@services';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { RouteProp } from '@react-navigation/native';

interface Section {
    date: string;
    data: Message[];
}

type RouteParams = {
    Chat: {
        loadMessages: boolean;
        contactWithMessages: ContactWithMessages;
    }
};

interface Props {
    route: RouteProp<RouteParams, 'Chat'>
}

export function ChatScreen({ route }: Props) {

    const [isLoading, setLoading] = useState<boolean>(true);
    const [sections, setSections] = useState<Section[]>([]);
    const [textInputHeight, setTextInputHeight] = useState<number>(35);
    const [messageText, setMessageText] = useState<string>('');
    const [paddingTop, setPaddingTop] = useState<number>(0);

    const sectionListRef: React.RefObject<SectionList> = useRef(null);

    const isMounted = useRef<boolean>(true);

    useEffect(
        () => {
            const loadMessages = route.params?.loadMessages;
            let contactWithMessages = route.params?.contactWithMessages;
            if (loadMessages) {
                api.getMessages(
                    globals.user.publicKey,
                    false,
                    false,
                    false,
                    false,
                    1000,
                    'time',
                    ''
                ).then(
                    response => {
                        const messages: ContactWithMessages[] = response?.OrderedContactsWithMessages ? response.OrderedContactsWithMessages : [];
                        const newContactWithMessages = messages.find(
                            message => message?.PublicKeyBase58Check === contactWithMessages.PublicKeyBase58Check
                        );

                        if (newContactWithMessages) {
                            contactWithMessages = newContactWithMessages;
                        }

                        if (isMounted) {
                            initializeSections(contactWithMessages);
                            setLoading(false);
                        }
                    }
                ).catch(error => globals.defaultHandleError(error));
            } else {
                initializeSections(contactWithMessages);
                setLoading(false);
            }

            Keyboard.addListener('keyboardWillShow', keyboardWillShow);
            Keyboard.addListener('keyboardWillHide', keyboardWillHide);

            return () => {
                isMounted.current = false;
                Keyboard.removeListener('keyboardWillShow', keyboardWillShow);
                Keyboard.removeListener('keyboardWillHide', keyboardWillHide);
            };
        },
        []
    );

    useEffect(
        () => {
            if (paddingTop !== 0) {
                scrollToBottom(false);
            }

            return () => {
                isMounted.current = false;
            };
        },
        [paddingTop]
    );

    const keyboardWillShow = (event: KeyboardEvent): void => {
        setPaddingTop(event.endCoordinates.height - 25);
    };

    const keyboardWillHide = () => {
        setPaddingTop(0);
    };

    function initializeSections(contactWithMessages: ContactWithMessages): void {
        const groupedMessages = groupMessagesByDay(contactWithMessages);
        const keys = Object.keys(groupedMessages);

        const newSections: Section[] = [];

        for (const key of keys) {
            const messages = groupedMessages[key];

            const section = {
                date: key,
                data: messages
            };

            for (let i = 0; i < messages.length; i++) {
                if (i === messages.length - 1 || messages[i].IsSender !== messages[i + 1].IsSender) {
                    messages[i].LastOfGroup = true;
                }
            }

            newSections.push(section);
        }

        setSections(newSections);
    }

    function groupMessagesByDay(contactWithMessages: ContactWithMessages): { [key: string]: Message[] } {
        const dayMessagesMap: { [key: string]: Message[] } = {};

        if (contactWithMessages?.Messages?.length > 0) {
            for (const message of contactWithMessages.Messages) {
                const messageDate = new Date(message.TstampNanos / 1000000);
                const formattedMessageDate = isToday(messageDate) ?
                    'Today' :
                    messageDate.toLocaleDateString(
                        'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric' }
                    );

                if (!dayMessagesMap[formattedMessageDate]) {
                    dayMessagesMap[formattedMessageDate] = [];
                }
                dayMessagesMap[formattedMessageDate].push(message);
            }
        }

        return dayMessagesMap;
    }

    function isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() == today.getDate() &&
            date.getMonth() == today.getMonth() &&
            date.getFullYear() == today.getFullYear();
    }

    async function onSendMessage(): Promise<void> {
        const contactWithMessages = route.params.contactWithMessages;
        const timeStampNanos = new Date().getTime() * 1000000;

        const message: Message = {
            DecryptedText: messageText,
            EncryptedText: '',
            IsSender: true,
            RecipientPublicKeyBase58Check: contactWithMessages.PublicKeyBase58Check,
            SenderPublicKeyBase58Check: globals.user.publicKey,
            TstampNanos: timeStampNanos,
            LastOfGroup: true,
            V2: true
        };

        let todaySection: Section = {
            date: '',
            data: []
        };

        if (sections.length > 0 && sections[sections.length - 1].date === 'Today') {
            todaySection = sections[sections.length - 1];
        }

        if (!todaySection) {
            todaySection = {
                date: 'Today',
                data: []
            };
            sections.push(todaySection);
        }

        if (todaySection.data.length > 0) {
            const lastMessage: Message = todaySection.data[todaySection.data.length - 1];
            if (lastMessage.IsSender) {
                lastMessage.LastOfGroup = false;
            }
        }

        todaySection.data.push(message);
        setSections(() => sections);

        try {
            const encryptedMessage = await signing.encryptShared(contactWithMessages.PublicKeyBase58Check, messageText);
            setMessageText('');

            api.sendMessage(globals.user.publicKey, contactWithMessages.PublicKeyBase58Check, encryptedMessage)
                .then(
                    async response => {
                        const transactionHex = response.TransactionHex;
                        const signedTransactionHex = await signing.signTransaction(transactionHex);
                        await api.submitTransaction(signedTransactionHex);
                    }
                ).catch(error => globals.defaultHandleError(error));
        } catch (exception) {
            globals.defaultHandleError(exception);
        }
    }

    function scrollToBottom(animated: boolean): void {
        if (sectionListRef?.current && sections?.length > 0) {
            const sectionIndex = sections.length - 1;
            const itemIndex = sections[sectionIndex].data.length - 1;
            sectionListRef.current.scrollToLocation({ itemIndex: itemIndex, sectionIndex: sectionIndex, animated: animated });
        }
    }

    const renderItem = (item: Message) => <View style={styles.messageComponent}>
        <MessageComponent message={item} />
    </View>;

    const keyExtractor = (item: Message, index: number) => `${item.SenderPublicKeyBase58Check}_${item.TstampNanos}_${index.toString()}`;

    const renderHeader = (date: string) => <View style={[styles.dateContainer, themeStyles.chipColor]}>
        <Text style={[styles.dateText, themeStyles.fontColorMain]}>{date}</Text>
    </View>;

    return isLoading ?
        <CloutFeedLoader />
        :
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}
            keyboardVerticalOffset={65}>
            <View style={[styles.container, themeStyles.containerColorSub, { paddingTop: paddingTop }]}>
                <SectionList
                    ref={sectionListRef}
                    onContentSizeChange={() => scrollToBottom(false)}
                    onScrollToIndexFailed={() => { undefined; }}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    sections={sections}
                    keyExtractor={keyExtractor}
                    renderItem={({ item }) => renderItem(item)}
                    renderSectionHeader={({ section: { date } }) => renderHeader(date)}
                />
                <View style={[
                    styles.textInputContainer,
                    { height: textInputHeight + 45 }
                ]}>
                    <TextInput
                        style={
                            [
                                styles.textInput,
                                { height: textInputHeight }
                            ]
                        }
                        onContentSizeChange={(event) => {
                            if (isMounted) {
                                setTextInputHeight(
                                    Math.max(Math.min(event.nativeEvent.contentSize.height, 100), 35)
                                );
                            }
                        }}
                        onChangeText={setMessageText}
                        value={messageText}
                        blurOnSubmit={false}
                        multiline={true}
                        maxLength={1000}
                        placeholder={'Type a message'}
                        placeholderTextColor={'rgba(241,241,242,0.43)'}
                        keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                    >
                    </TextInput>

                    <TouchableOpacity style={styles.sendButton} onPress={onSendMessage}>
                        <Ionicons name="send" size={32} color="rgba(241,241,242,0.43)" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>;
}

const styles = StyleSheet.create(
    {
        container: {
            marginTop: 1,
            width: Dimensions.get('window').width,
            height: '100%'
        },
        dateContainer: {
            alignSelf: 'center',
            borderRadius: 8,
            paddingVertical: 2,
            paddingHorizontal: 6,
            marginVertical: 4,
            borderWidth: 1,
            borderColor: 'black'
        },
        dateText: {
            fontSize: 10,
            fontWeight: '700'
        },
        textInputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingBottom: 36,
            paddingTop: 8,
            backgroundColor: settingsGlobals.darkMode ?
                themeStyles.containerColorMain.backgroundColor : '#1e2428'
        },
        textInput: {
            minHeight: 35,
            borderRadius: 25,
            marginLeft: 6,
            marginRight: 12,
            paddingHorizontal: 10,
            color: 'white',
            flex: 1,
            fontSize: 16,
            backgroundColor: settingsGlobals.darkMode ?
                themeStyles.containerColorSub.backgroundColor : '#33383b'
        },
        sendButton: {
            marginRight: 5
        },
        messageComponent: {
            flexDirection: 'row'
        }
    }
);
