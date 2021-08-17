import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import ProfileInfoImageComponent from './profileInfoImage.component';
import ProfileInfoUsernameComponent from './profileInfoUsername.component';
import CoinPriceComponent from './coinPrice.component';
import { Ionicons } from '@expo/vector-icons';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { Profile } from '@types';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    profile: Profile;
    duration?: string;
    isProfileManager?: boolean;
    ìsDarkMode?: boolean;
    imageSize?: number;
    navigation: StackNavigationProp<ParamListBase>;
    peekDisabled?: boolean;
    noCoinPrice?: boolean;
}

export default class ProfileInfoCardComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.profile !== nextProps.profile ||
            this.props.duration !== nextProps.duration;
    }

    render(): JSX.Element {
        const coinPrice = calculateAndFormatBitCloutInUsd(this.props.profile?.CoinPriceBitCloutNanos);
        return <View style={styles.container}>
            <ProfileInfoImageComponent
                peekDisabled={this.props.peekDisabled}
                navigation={this.props.navigation}
                profile={this.props.profile}
                imageSize={this.props.imageSize}
            />
            <View>
                <ProfileInfoUsernameComponent
                    peekDisabled={this.props.peekDisabled}
                    navigation={this.props.navigation}
                    isDarkMode={this.props.ìsDarkMode}
                    profile={this.props.profile}
                />

                <View style={styles.bottomRow}>
                    {
                        !this.props.noCoinPrice &&
                        <CoinPriceComponent
                            isDarkMode={this.props.ìsDarkMode}
                            isProfileManager={this.props.isProfileManager}
                            price={coinPrice}
                        />
                    }
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
