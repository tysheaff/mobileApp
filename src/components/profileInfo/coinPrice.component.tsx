import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { themeStyles } from '@styles/globalColors';

interface Props {
    price: string;
    isProfileManager?: boolean;
    isDarkMode?: boolean;
}

export default class CoinPriceComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.price !== nextProps.price;
    }

    render(): JSX.Element {
        return <View style={
            [
                styles.container,
                this.props.isProfileManager ? themeStyles.coinPriceContainer : themeStyles.chipColor,
                this.props.isDarkMode && styles.loginCoinContainer
            ]
        }>
            <Text style={
                [
                    styles.price,
                    themeStyles.fontColorMain,
                    this.props.isDarkMode && styles.loginCoinText
                ]
            }>
                ~${this.props.price}</Text>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            borderRadius: 12,
            paddingHorizontal: 10,
            height: 20,
            alignSelf: 'flex-start',
            justifyContent: 'center',
            marginTop: 6
        },
        price: {
            fontSize: 10,
            fontWeight: '600'
        },
        loginCoinContainer: {
            backgroundColor: '#262525'
        },
        loginCoinText: {
            color: '#ebebeb'
        }
    }
);
