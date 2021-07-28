import React from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

interface Props {
    username: string;
    verified: boolean;
    showCreatorCoinHolding?: boolean;
    isLarge?: boolean;
    isDarkMode?: boolean;
}

export default class ProfileInfoUsernameComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.username !== nextProps.username;
    }

    render(): JSX.Element {
        return <View style={styles.container}>
            <Text style={
                [
                    styles.username,
                    this.props.isDarkMode ?
                        styles.darkText
                        : themeStyles.fontColorMain,
                    this.props.isLarge && styles.chatHeaderUsername,
                ]
            }>
                {this.props.username}
            </Text>
            {
                this.props.verified &&
                <MaterialIcons name="verified" size={16} style={styles.verified} color="#007ef5" />
            }
            {
                !!this.props.showCreatorCoinHolding &&
                <AntDesign style={styles.starIcon} name={'star'} size={15} color={'#ffdb58'} />
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2
        },
        verified: {
            marginLeft: 5,
        },
        starIcon: {
            marginBottom: 3
        },
        chatHeaderUsername: {
            fontSize: 16,
        },
        darkText: {
            color: '#ebebeb'
        }
    }
);
