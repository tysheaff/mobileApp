import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { themeStyles } from '@styles';

interface Props {
    title: string;
    isSubColor: boolean;
}

export class BadgeListHeader extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return <View
            style={[
                styles.pageTitlesContainer,
                themeStyles.containerColorMain,
                themeStyles.borderColor,
            ]}
        >
            <Text
                style={[
                    styles.pageTitleText,
                    this.props.isSubColor
                        ? themeStyles.fontColorSub
                        : themeStyles.fontColorMain,
                ]}
            >
                {this.props.title}
            </Text>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        pageTitlesContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            paddingVertical: 10,
        },
        pageTitleText: {
            fontWeight: '500',
            fontSize: 14,
            textAlign: 'center',
        },
    }
);
