import React from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
    username: string;
    verified: boolean;
}

export default class ProfileInfoUsernameComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.username !== nextProps.username ||
            this.props.verified !== nextProps.verified;
    }

    render(): JSX.Element {
        return <View style={styles.container}>
            <Text style={[styles.username, themeStyles.fontColorMain]}>{this.props.username}</Text>
            {
                this.props.verified
                && <MaterialIcons name="verified" size={16} style={styles.verified} color="#007ef5" />
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
        }
    }
);
