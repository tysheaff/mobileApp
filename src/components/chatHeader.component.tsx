import { ParamListBase, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { ContactWithMessages } from '@types';
import { StackNavigationProp } from '@react-navigation/stack';
import MessageInfoCardComponent from './profileInfo/messageInfoCard.component';

export function ChatHeaderComponent(
    { contactWithMessages }: { contactWithMessages: ContactWithMessages }
): JSX.Element {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    function goToProfile(): void {
        if (
            contactWithMessages.ProfileEntryResponse &&
            contactWithMessages.ProfileEntryResponse.Username !== 'anonymous') {
            navigation.push(
                'UserProfile',
                {
                    publicKey: contactWithMessages.ProfileEntryResponse.PublicKeyBase58Check,
                    username: contactWithMessages.ProfileEntryResponse.Username,
                    Key: 'Profile_' + contactWithMessages.ProfileEntryResponse.PublicKeyBase58Check
                }
            );
        }
    }

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <Ionicons name="chevron-back" size={32} color="#007ef5" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={goToProfile}>
            <MessageInfoCardComponent
                publicKey={contactWithMessages.ProfileEntryResponse?.PublicKeyBase58Check}
                username={contactWithMessages.ProfileEntryResponse?.Username}
                verified={contactWithMessages.ProfileEntryResponse?.IsVerified}
                isLarge
            />
        </TouchableOpacity>
    </View>;
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            height: 50

        },
    }
);
