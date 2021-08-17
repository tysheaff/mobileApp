import { Dimensions, StyleSheet } from 'react-native';

export const notificationsStyles = StyleSheet.create(
    {
        notificationContainer: {
            height: 65,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            width: Dimensions.get('window').width
        },
        centerTextVertically: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        textContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: Dimensions.get('window').width - 74
        },
        usernameText: {
            fontWeight: '700'
        },
        iconContainer: {
            position: 'absolute',
            left: 35,
            bottom: 4,
            borderRadius: 20,
            width: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        },
        postText: {
            marginTop: 4,
            fontWeight: '500'
        },
    }
);
