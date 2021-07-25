import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { StyleSheet, View, Text, Linking, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import CloutFeedButton from '@components/cloutfeedButton.component';

interface Props {
    close: () => void;
}

export class BitBadgesIntroductionComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    private async markAsCompleted() {
        const key =
            globals.user.publicKey +
            '_' +
            constants.localStorage_bitBadgesIntroduction;

        try {
            await SecureStore.setItemAsync(key, 'true');
            this.props.close();
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private goToBitBadgesWebsite(this: void) {
        Linking.openURL('https://bitbadges.web.app');
    }

    private goToDocumentation(this: void) {
        Linking.openURL('https://bitbadges.github.io');
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <View style={styles.headerContainer}>
                <Image
                    style={styles.logo}
                    source={require('../../../../assets/bitBadgesLogo.png')}
                />
                <Text style={[styles.title, themeStyles.fontColorMain]}>
                    BitBadges
                </Text>
            </View>

            <ScrollView style={styles.scrollView} bounces={false}>
                <Text style={[themeStyles.fontColorMain]}>
                    <Text>
                        <Text
                            style={[styles.link, themeStyles.linkColor]}
                            onPress={this.goToBitBadgesWebsite}
                        >
                            BitBadges{' '}
                        </Text>
                        is a BitClout community project that allows users to issue NFT,
                        non-transferable badges between users.
                    </Text>
                    {'\n\n'}
                    <Text>
                        Badges have customizable attributes similar to NFTs such as a title,
                        image, description, color, start & end dates, and a URL link.
                    </Text>
                    {'\n\n'}
                    <Text>
                        They are stored permanently on the blockchain, so once you earn
                        one, no one can ever take it away from you! This also means to be extra careful
                        and double check everything before you issue one
                    </Text>
                    {'\n\n'}
                    <Text>
                        When you receive a badge, you must accept or reject it.
                        This means that on CloutFeed, your profile will only display the badges you approve.
                    </Text>
                    {'\n\n'}
                    <Text>Get started by issuing a badge to another user!</Text>
                    {'\n\n'}
                    View
                    <Text
                        style={[styles.link, themeStyles.linkColor]}
                        onPress={this.goToDocumentation}
                    >
                        {' '}
                        Documentation{' '}
                    </Text>
                    for more information.
                </Text>
            </ScrollView>

            <CloutFeedButton
                styles={[styles.continueButton, themeStyles.buttonBorderColor]}
                title="Continue"
                onPress={this.markAsCompleted.bind(this)}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingHorizontal: '8%',
            paddingTop: '5%',
            alignItems: 'center',
        },
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        logo: {
            height: 50,
            width: 50,
        },
        title: {
            fontSize: 28,
            fontWeight: '600',
        },
        continueButton: {
            alignSelf: 'stretch',
            height: 44,
            marginBottom: '10%',
            marginTop: 'auto',
        },
        scrollView: {
            marginBottom: 20,
        },
        link: {
            fontWeight: '500'
        }
    }
);
