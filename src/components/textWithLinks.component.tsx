import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { StyleSheet, Text, Linking } from 'react-native';
import Autolink from 'react-native-autolink';
import { themeStyles } from '@styles/globalColors';

export function TextWithLinks({ text, style, numberOfLines }: { text: string, style?: any[], numberOfLines?: number }) {
    const navigation = useNavigation();
    style = style ? style : [];

    function onLinkPressed(p_url: string, p_match: any) {
        const linkType = p_match.getType();

        switch (linkType) {
            case 'url':
                const postLink = 'bitclout.com/posts/';
                const isPostLink = p_url.includes(postLink);

                if (isPostLink) {
                    const postHashHexStartIndex = p_url.indexOf(postLink) + postLink.length;
                    const postHashHex = p_url.slice(postHashHexStartIndex);

                    (navigation as any).push('Post', {
                        postHashHex: postHashHex,
                        key: 'Post_' + postHashHex
                    });
                } else {
                    if (!p_url.startsWith('https://') && !p_url.startsWith('https://')) {
                        p_url = 'https://' + p_url;
                    }
                    Linking.openURL(p_url).catch(() => { });
                }
                break;
            case 'mention':
                const userName = p_url.slice(1);
                (navigation as any).push('UserProfile', {
                    username: userName,
                    navigateByUsername: true,
                    key: 'Post_' + userName
                });
                break;
            case 'hashtag':
                return (navigation as any).push('CloutTagPosts', {
                    cloutTag: p_match.hashtag,
                    key: 'CloutTag_' + p_match.hashtag
                });
        }
    }

    function renderLink(p_text: string) {
        const postLink = 'bitclout.com/posts/';
        const isPostLink = p_text.includes(postLink);

        if (isPostLink) {
            return 'Go to Post';
        } else {
            return p_text;
        }
    }

    return <Autolink
        style={style}
        text={text}
        mention="twitter"
        hashtag="twitter"
        renderLink={(text, match, index) => (
            <Text
                style={[styles.link, themeStyles.linkColor]}
                key={index}
                onPress={() => onLinkPressed(text, match)}
            >
                {renderLink(text)}
            </Text>
        )}
        numberOfLines={numberOfLines}
    />
}

const styles = StyleSheet.create({
    link: {
        fontWeight: '500'
    }
});
