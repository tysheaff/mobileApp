import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import ProfileInfoImageComponent from './profileInfoImage.component';
import ProfileInfoUsernameComponent from './profileInfoUsername.component';
import CoinPriceComponent from './coinPrice.component';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    publicKey: string;
    username: string;
    coinPrice: string;
    verified: boolean;
    duration?: string;
    isProfileManager?: boolean;
}

export default class ProfileInfoCardComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.username !== nextProps.username ||
            this.props.coinPrice !== nextProps.coinPrice;
    }

    render(): JSX.Element {
        return <View style={[styles.container]}>
            <ProfileInfoImageComponent publicKey={this.props.publicKey} />
            <View>
                <ProfileInfoUsernameComponent verified={this.props.verified} username={this.props.username} />
                <View style={styles.bottomRow}>
                    <CoinPriceComponent isProfileManager={this.props.isProfileManager} price={this.props.coinPrice} />
                    {
                        this.props.duration &&
                        <>
                            <Ionicons style={styles.durationIcon} name="ios-time-outline" size={14} color={themeStyles.fontColorSub.color} />
                            <Text style={[styles.durationText, themeStyles.fontColorSub]}>{this.props.duration}</Text>
                        </>
                    }
                </View>
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
            alignItems: 'center'
        },
        durationIcon: {
            marginLeft: 8,
            marginRight: 2,
            marginTop: 6
        },
        durationText: {
            fontSize: 12,
            marginTop: 6
        }
    }
);
