import React from 'react';
import { Linking, Text } from 'react-native';
import { themeStyles } from '@styles/globalColors';

export const introduction = [
    {
        title: 'Welcome!',
        imageUri: require('../../../../assets/intro1.png'),
        description: <Text>BitClout is a new type of social network that mixes speculation and social media, and it’s built from the ground up as its own custom blockchain. Its architecture is similar to Bitcoin.
            {'\n'}For more info, check
            {' '}<Text
                onPress={() => Linking.openURL('https://docs.bitclout.com/')}
                style={[{ fontWeight: '500' }, , themeStyles.linkColor]}>
                Bitclout docs
            </Text>
            {' '}</Text>,
    },
    {
        title: 'What is CloutFeed?',
        imageUri: require('../../../../assets/intro2.png'),
        description: `CloutFeed is a user-friendly mobile app that allows users to access BitClout from the convenience of their smartphones. Say goodbye to computer screens! Make the most out of BitClout with the all-new mobile experience`
    },
    {
        title: 'Why CloutFeed?',
        imageUri: require('../../../../assets/intro3.png'),
        description: `With BitClout, people who own a certain amount of their coin can message them, or they could simply rank and prioritize messages from the largest holders of their coin.`,
    },
    {
        title: 'What can you do in Cloutfeed?',
        imageUri: require('../../../../assets/intro4.png'),
        description: `Express yourself, share ideas and post what is on your mind, message your investors or direct message your favorite creators, you can also analyze profiles with accurate user-friendly tools`,
    },
    {
        title: `Let's go!`,
        imageUri: require('../../../../assets/intro5.png'),
        description: <Text>What are you waiting for? Start earning Bitclouts and socializing with your friends now! Stay updated with the latest news with push notifications.{'\n '} Don't have an account?
            {' '}<Text
                onPress={() => Linking.openURL('https://bitclout.com/')}
                style={[{ fontWeight: '500' }, , themeStyles.linkColor]}>
                Sign up
            </Text>
        </Text>,
    },
];
