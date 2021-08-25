import React from 'react';
import { Linking, Text } from 'react-native';
import { themeStyles } from '@styles/globalColors';

export interface IntroductionElement {
    title: string;
    imageUri: string;
    description: string | JSX.Element;
}

export const introduction: IntroductionElement[] = [
    {
        title: 'Welcome!',
        imageUri: require('../../../../assets/intro1.png'),
        description: <Text>BitClout is a new type of social network that mixes speculation and social media, and it’s built from the ground up as its own custom blockchain. Its architecture is similar to Bitcoin.{'\n'}{'\n'}Like Bitcoin, BitClout is a fully open-source project and there is no company behind it; it’s just coins and code.
            For more info, check
            {' '}<Text
                onPress={() => Linking.openURL('https://docs.bitclout.com/')}
                style={[{ fontWeight: '500' }, themeStyles.linkColor]}>
                Bitclout docs
            </Text>
        </Text>,
    },
    {
        title: 'What are Creator Coins?',
        imageUri: require('../../../../assets/intro6.png'),
        description: 'Every profile on the platform gets its own coin that anybody can buy and sell. We call these coins “creator coins,” and you can have your own coin too simply by creating a profile. The price of each coin goes up when people buy and goes down when people sell.'
    },
    {
        title: 'What is CloutFeed?',
        imageUri: require('../../../../assets/intro2.png'),
        description: 'CloutFeed is a user-friendly mobile app that allows users to access BitClout from the convenience of their smartphones. Say goodbye to computer screens! Make the most out of BitClout with the all-new mobile experience'
    },
    {
        title: 'Why CloutFeed?',
        imageUri: require('../../../../assets/intro3.png'),
        description: <Text>
            CloutFeed is the first BitClout mobile application. It is
            {' '}<Text
                onPress={() => Linking.openURL('https://github.com/CloutFeed/mobileApp')}
                style={[{ fontWeight: '500' }, themeStyles.linkColor]}>
                open-source
            </Text> and has been vetted multiple times.{'\n'}{'\n'}CloutFeed maximizes your BitClout experience with countless exclusive features that are just available for CloutFeed's users like CloutTags, post notifications and much more.
        </Text>
    },
    {
        title: 'Let\'s go!',
        imageUri: require('../../../../assets/intro5.png'),
        description: <Text>What are you waiting for? Start earning BitClout and socializing with your friends now! Stay updated with the latest news with native notifications.{'\n '} Don't have an account?
            {' '}<Text
                onPress={() => Linking.openURL('https://bitclout.com/')}
                style={[{ fontWeight: '500' }, themeStyles.linkColor]}>
                Sign up
            </Text>
        </Text>,
    },
];
