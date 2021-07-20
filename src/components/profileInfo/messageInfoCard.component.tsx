import React from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import ProfileInfoImageComponent from './profileInfoImage.component';
import ProfileInfoUsernameComponent from './profileInfoUsername.component';
import { themeStyles } from '@styles/globalColors';

interface Props {
    publicKey: string;
    username: string;
    verified: boolean;
    lastMessage?: string;
    duration?: string;
    showCreatorCoinHolding?: boolean;
    isLarge: boolean;
}

export default class MessageInfoCardComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.publicKey !== nextProps.publicKey ||
            this.props.lastMessage !== nextProps.lastMessage;
    }

    render(): JSX.Element {
        return <View style={styles.container}>
            <ProfileInfoImageComponent isLarge={this.props.isLarge} publicKey={this.props.publicKey} />
            <View>
                <ProfileInfoUsernameComponent
                    isLarge={this.props.isLarge}
                    showCreatorCoinHolding={this.props.showCreatorCoinHolding}
                    verified={this.props.verified} username={this.props.username} />
                {
                    !!this.props.lastMessage &&
                    <View style={styles.bottomRow}>
                        <Text style={[styles.lastMessage, themeStyles.fontColorSub]}>{this.props.lastMessage}</Text>
                        <Text style={[styles.lastMessage, themeStyles.fontColorSub]}> • {this.props.duration}</Text>
                    </View>
                }
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        bottomRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2,
        },
        lastMessage: {
            fontSize: 13,
            maxWidth: Dimensions.get('window').width * 0.5,
        },
    }
);
