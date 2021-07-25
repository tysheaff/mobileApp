import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { themeStyles } from '@styles';
import { TextWithLinks } from '@components/textWithLinks.component';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    text: string;
    label: string;
}

export class BitBadgesDetails extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return <View style={styles.details}>
            <Text style={themeStyles.fontColorMain}>
                <Text style={styles.detailsLabel}>{this.props.label}</Text>
                <TextWithLinks
                    navigation={this.props.navigation}
                    isProfile
                    numberOfLines={10}
                    style={[themeStyles.fontColorMain]}
                    text={this.props.text}
                />
            </Text>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        details: {
            fontSize: 12,
            flexDirection: 'row',
            padding: 5,
        },
        detailsLabel: {
            fontWeight: 'bold',
        },
    }
);
