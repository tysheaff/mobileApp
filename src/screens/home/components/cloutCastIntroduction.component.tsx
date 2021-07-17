import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';

interface Props {
    close: () => void;
}

export class CloutCastIntroductionComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        this.close = this.close.bind(this);
    }

    private async close(): void {
        const key = globals.user.publicKey + '_' + constants.localStorage_cloutCastIntroduction;
        await SecureStore.setItemAsync(key, 'true');
        this.props.close();
    }

    render(): JSX.Element {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <View style={styles.headerContainer}>
                <Image
                    style={styles.logo}
                    source={require('../../../../assets/cloutCastLogo.png')}
                ></Image>
                <Text style={[styles.title, themeStyles.fontColorMain]}>CloutCast</Text>
            </View>
            <ScrollView style={styles.scrollView} bounces={false}>
                <Text style={[themeStyles.fontColorMain]}>
                    <Text>
                        <Text
                            style={[{ fontWeight: '500' }, themeStyles.linkColor]}
                            onPress={() => Linking.openURL('https://cloutcast.io')}>
                            CloutCast{' '}
                        </Text>
                        is the first Promoted Post engine for the Bitclout ecosystem.
                    </Text>
                    {'\n\n'}
                    <Text>
                        CloutCast provides a monetary incentive to promote others & a means for anyone to scale up their platform from scratch.
                    </Text>
                    {'\n\n'}
                    <Text>
                        How does it work?
                    </Text>
                    {'\n\n'}
                    Anyone can be a promoter. Like club promoters, but less mesh shirts and better pay.
                    Whether someone has sent you a promotion link, or you find some promotions you're willing to promote on the CloutCast wall you simply:
                    {'\n\n'}
                    1. Check out the promotion to see the payout.
                    {'\n\n'}
                    2. Do the promoted engagement (comment, reclout, or quote).
                    {'\n\n'}
                    3. Tap "Verify", and claim your payout on CloutCast wallet!
                    {'\n\n'}
                    Read this
                    <Text
                        style={[{ fontWeight: '500' }, themeStyles.linkColor]}
                        onPress={() => Linking.openURL('https://www.notion.so/CloutCast-Read-Me-5dd54d062e9543b5a55316dc83627aa6')}
                    > White Paper </Text>
                    for more information.
                </Text>
            </ScrollView>
            <TouchableOpacity
                onPress={() => this.close()}
                style={[styles.continueButton, themeStyles.buttonBorderColor]}
                activeOpacity={0.8}
            >
                <Text style={[styles.continueButtonText]}>Continue</Text>
            </TouchableOpacity>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingLeft: '10%',
            paddingRight: '10%',
            paddingTop: '5%',
            alignItems: 'center'
        },
        test: {

        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
        },
        logo: {
            height: 50,
            width: 50
        },
        title: {
            fontSize: 28,
            fontWeight: '600',
            marginTop: 5,
            marginLeft: 12
        },
        continueButton: {
            backgroundColor: 'black',
            color: 'white',
            alignSelf: 'stretch',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            borderWidth: 1,
            marginBottom: '20%',
            marginTop: 'auto'
        },
        continueButtonText: {
            color: 'white',
            fontSize: 18,
            fontWeight: '500'
        },
        scrollView: {
            marginBottom: 20
        }
    }
);
