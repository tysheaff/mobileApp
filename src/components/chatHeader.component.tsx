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

    return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.borderColor]}>

        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
            <Ionicons name="chevron-back" size={32} color="#007ef5" />
        </TouchableOpacity>

        <MessageInfoCardComponent
            navigation={navigation}
            profile={contactWithMessages.ProfileEntryResponse}
            isLarge
            imageSize={30}
        />
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
