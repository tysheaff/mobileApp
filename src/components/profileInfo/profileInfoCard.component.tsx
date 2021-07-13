import React from 'react';
import { StyleSheet, View } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import ProfileInfoImageComponent from './profileInfoImage.component';
import ProfileInfoUsernameComponent from './profileInfoUsername.component';
import CoinPriceComponent from './coinPrice.component';

interface Props {
    publicKey: string;
    username: string;
    coinPrice: string;
}

export default class ProfileInfoCardComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props) {
        return this.props.username !== nextProps.username ||
            this.props.coinPrice !== nextProps.coinPrice;
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <ProfileInfoImageComponent publicKey={this.props.publicKey} />
            <View>
                <ProfileInfoUsernameComponent verified username={this.props.username} />
                <CoinPriceComponent price={this.props.coinPrice} />
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center'
        }
    }
);
