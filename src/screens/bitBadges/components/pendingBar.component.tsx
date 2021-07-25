import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { globals } from '@globals/globals';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    username: string;
    pending: string[];
    navigation: StackNavigationProp<ParamListBase>;
}

export class PendingBar extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.goToPendingPage = this.goToPendingPage.bind(this);
    }

    private goToPendingPage() {
        this.props.navigation.push('Pending',
            {
                username: globals.user.username,
                publicKey: globals.user.publicKey,
                pending: this.props.pending,
            }
        );
    }

    render() {
        return <>
            {
                !globals.readonly &&
                this.props.pending.length > 0 &&
                this.props.username === globals.user.username &&
                <View
                    style={[
                        styles.headerContainer,
                        themeStyles.containerColorSub,
                        themeStyles.borderColor,
                    ]}
                >
                    <Text style={[themeStyles.fontColorMain, styles.headerText]}>
                        You have {this.props.pending.length} pending badge
                        {this.props.pending.length !== 1 ? 's' : ''}
                    </Text>

                    <CloutFeedButton styles={[styles.headerButton]} title={'View Pending'} onPress={this.goToPendingPage.bind(this)} />
                </View>
            }
        </>;
    }
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            width: '100%',
            minHeight: 50,
        },
        headerButton: {
            marginRight: 10,
            marginBottom: 0,
            width: 120,
        },
        headerText: {
            paddingLeft: 10
        },
    }
);
