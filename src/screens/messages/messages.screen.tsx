import React from 'react';
import { eventManager } from '@globals/injector';
import { themeStyles } from '@styles/globalColors';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { ContactWithMessages, EventType } from '@types';
import { MessageFilter, MessageSettingsComponent, MessageSort } from './components/messageSettings';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import { api } from '@services';
import { getAnonymousProfile } from '@services';
import { ContactMessagesListCardComponent } from '@screens/messages/components/contactMessagesListCard.component';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { messagesService } from '@services/messagesServices';

interface State {
    isLoading: boolean;
    isFilterShown: boolean;
    messagesFilter: MessageFilter[];
    messagesSort: MessageSort;
    contacts: ContactWithMessages[];
    refreshing: boolean;
    isLoadingMore: boolean;
    noMoreMessages: boolean;
}

export class MessagesScreen extends React.Component<Record<string, never>, State>{

    private _isMounted = false;

    private _subscriptions: (() => void)[] = [];

    constructor(props: Record<string, never>) {
        super(props);

        this.state = {
            isLoading: true,
            isFilterShown: false,
            messagesFilter: [],
            messagesSort: MessageSort.MostRecent,
            contacts: [],
            refreshing: false,
            isLoadingMore: false,
            noMoreMessages: false
        };

        messagesService.getMessageSettings().then(
            ({ messagesFilter, messagesSort }) => {
                this.loadMessages(messagesFilter, messagesSort);

                if (this._isMounted) {
                    this.setState({ messagesFilter, messagesSort });
                }
            }
        );

        this._subscriptions.push(
            eventManager.addEventListener(EventType.OpenMessagesSettings, this.toggleMessagesFilter.bind(this))
        );

        this.loadMessages = this.loadMessages.bind(this);
        this.loadMoreMessages = this.loadMoreMessages.bind(this);
        this.onMessageSettingChange = this.onMessageSettingChange.bind(this);
        this.toggleMessagesFilter = this.toggleMessagesFilter.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        globals.dispatchRefreshMessagesEvent();

        for (const unsubscribe of this._subscriptions) {
            unsubscribe();
        }

        this._isMounted = false;
    }

    shouldComponentUpdate(_nextProps: Record<string, never>, nextState: State): boolean {
        return nextState.isFilterShown !== this.state.isFilterShown ||
            nextState.isLoading !== this.state.isLoading ||
            nextState.isLoadingMore !== this.state.isLoadingMore;
    }

    private loadMessages(messageFilter: MessageFilter[], messageSort: MessageSort): void {
        if (this._isMounted && !this.state.isLoading) {
            this.setState({ isLoading: true });
        }

        messagesService.getMessagesCallback(messageFilter, 25, messageSort, '').then(
            response => {
                const contacts = this.processData(response);
                if (this._isMounted) {
                    this.setState(
                        {
                            contacts,
                            isLoading: false,
                            noMoreMessages: contacts.length < 25
                        }
                    );
                }
            }
        );
    }

    private loadMoreMessages(messageFilter: MessageFilter[], messageSort: MessageSort): void {
        if (this.state.isLoadingMore || !this.state.contacts || this.state.contacts.length === 0 || this.state.noMoreMessages) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoadingMore: true });
        }

        const lastPublicKey = this.state.contacts[this.state.contacts.length - 1].PublicKeyBase58Check;

        messagesService.getMessagesCallback(messageFilter, 25, messageSort, lastPublicKey).then(
            response => {
                const contacts = this.processData(response);

                if (this._isMounted) {
                    this.setState(
                        {
                            contacts: this.state.contacts.concat(contacts),
                            isLoadingMore: false,
                            noMoreMessages: contacts.length < 25
                        }
                    );
                }
            }
        );
    }

    private processData(response: any): ContactWithMessages[] {
        const unreadStateByContact = response?.UnreadStateByContact ? response.UnreadStateByContact : {};
        const contactsWithMessages: ContactWithMessages[] = response?.OrderedContactsWithMessages ? response.OrderedContactsWithMessages : [];

        for (const contactWithMessages of contactsWithMessages) {
            if (!contactWithMessages.ProfileEntryResponse) {
                contactWithMessages.ProfileEntryResponse = getAnonymousProfile(contactWithMessages.PublicKeyBase58Check);
            } else {
                contactWithMessages.ProfileEntryResponse.ProfilePic = api.getSingleProfileImage(contactWithMessages.PublicKeyBase58Check);
            }

            contactWithMessages.UnreadMessages = unreadStateByContact[contactWithMessages.PublicKeyBase58Check];
        }

        return contactsWithMessages;
    }

    private toggleMessagesFilter(): void {
        if (this._isMounted) {
            this.setState({ isFilterShown: true });
        }
    }

    private async onMessageSettingChange(filter: MessageFilter[], sort: MessageSort) {

        try {
            const filterJson = JSON.stringify(filter);

            if (filterJson === JSON.stringify(this.state.messagesFilter) && sort === this.state.messagesSort) {
                this.setState({ isFilterShown: false });
                return;
            }

            const messageFilterKey = globals.user.publicKey + constants.localStorage_messagesFilter;
            await SecureStore.setItemAsync(messageFilterKey, filterJson);

            const messageSortKey = globals.user.publicKey + constants.localStorage_messagesSort;
            await SecureStore.setItemAsync(messageSortKey, sort);

            if (this._isMounted) {
                this.setState({ messagesFilter: filter, messagesSort: sort, isFilterShown: false });
                this.loadMessages(filter, sort);
            }
        } catch { undefined; }
    }

    render(): JSX.Element {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.isLoading ?
                    <CloutFeedLoader />
                    :
                    globals.readonly ?
                        <View style={[styles.readOnlyText, styles.container, themeStyles.containerColorSub]}>
                            <Text style={[themeStyles.fontColorMain]}>Messages are not available in the read-only mode.</Text>
                        </View>
                        :
                        <View style={[styles.container, themeStyles.containerColorMain]}>
                            <FlatList
                                data={this.state.contacts}
                                keyExtractor={(item, index) => item.PublicKeyBase58Check + index.toString()}
                                renderItem={({ item }) => <ContactMessagesListCardComponent contactWithMessages={item}></ContactMessagesListCardComponent>}
                                refreshControl={<RefreshControl
                                    tintColor={themeStyles.fontColorMain.color}
                                    titleColor={themeStyles.fontColorMain.color}
                                    refreshing={this.state.refreshing}
                                    onRefresh={() => this.loadMessages(this.state.messagesFilter, this.state.messagesSort)}

                                />}
                                onEndReached={() => this.loadMoreMessages(this.state.messagesFilter, this.state.messagesSort)}
                                ListFooterComponent={() => this.state.isLoadingMore ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : <View></View>}
                            />
                        </View>
            }

            {
                this.state.isFilterShown &&
                <MessageSettingsComponent
                    filter={this.state.messagesFilter}
                    sort={this.state.messagesSort}
                    isFilterShown={this.state.isFilterShown}
                    onSettingsChange={(filter: MessageFilter[], sort: MessageSort) => this.onMessageSettingChange(filter, sort)}
                />
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            width: '100%'
        },
        readOnlyText: {
            alignItems: 'center',
            justifyContent: 'center'
        }
    }
);
