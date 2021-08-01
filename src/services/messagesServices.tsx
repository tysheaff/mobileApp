import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import { MessageFilter, MessageSort } from '@screens/messages/components/messageSettings';
import * as SecureStore from 'expo-secure-store';
import { api } from './api/api';

function validSort(value: MessageSort): boolean {
    return value === MessageSort.MostRecent ||
        value === MessageSort.MostFollowed ||
        value === MessageSort.MostClout ||
        value === MessageSort.LargestHolder;
}

async function getMessageSettings(): Promise<{ messagesFilter: MessageFilter[], messagesSort: MessageSort }> {
    let messagesFilter: MessageFilter[] = [];
    let messagesSort: MessageSort = MessageSort.MostRecent;

    const messageFilterKey = globals.user.publicKey + constants.localStorage_messagesFilter;
    const messageFilterString = await SecureStore.getItemAsync(messageFilterKey);

    if (messageFilterString) {
        try {
            const messagesFilterValue = JSON.parse(messageFilterString);
            if (messagesFilterValue.constructor === Array) {
                messagesFilter = messagesFilterValue;
            }
        } catch { undefined; }
    }

    const messageSortKey = globals.user.publicKey + constants.localStorage_messagesSort;
    const messageSortValue = await SecureStore.getItemAsync(messageSortKey) as MessageSort;

    if (messageSortValue && validSort(messageSortValue)) {
        messagesSort = messageSortValue;
    }
    return { messagesFilter, messagesSort };
}

async function getMessagesCallback(messageFilter: MessageFilter[], numToFetch: number, messageSort: MessageSort, lastPublicKey: string): Promise<any> {
    messageFilter = messageFilter ? messageFilter : [];
    const response = await api.getMessages(
        globals.user.publicKey,
        messageFilter.indexOf(MessageFilter.Followers) !== -1,
        messageFilter.indexOf(MessageFilter.Following) !== -1,
        messageFilter.indexOf(MessageFilter.Holders) !== -1,
        messageFilter.indexOf(MessageFilter.Holding) !== -1,
        numToFetch,
        messageSort,
        lastPublicKey
    );
    return response;
}

async function getUnreadMessages() {
    let response;
    try {
        const { messagesFilter, messagesSort } = await getMessageSettings();
        response = await getMessagesCallback(messagesFilter, 5, messagesSort, '');
    } catch { undefined; }
    return response.NumberOfUnreadThreads;
}

export const messagesService = {
    getMessageSettings,
    getMessagesCallback,
    getUnreadMessages
};
