import React from 'react';
import { StyleSheet, Text, Linking } from 'react-native';
import Autolink from 'react-native-autolink';
import { themeStyles } from '@styles/globalColors';
import { NavigationProp } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<any>;
    text: string;
    style?: any[];
    numberOfLines?: number;
    isProfile?: boolean;
}

interface State {
    textHidden: boolean;
    numberOfLines: number | undefined;
    showMoreButton: boolean;
}

export class TextWithLinks extends React.Component<Props, State>{

    private _textInit = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            textHidden: true,
            showMoreButton: false,
            numberOfLines: this.props.numberOfLines != null ? this.props.numberOfLines + 1 : undefined
        };

        this.onLinkPressed = this.onLinkPressed.bind(this);
        this.renderLink = this.renderLink.bind(this);
        this.toggleText = this.toggleText.bind(this);
        this.onTextLayout = this.onTextLayout.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return p_nextProps.text !== this.props.text ||
            p_nextState.textHidden !== this.state.textHidden ||
            p_nextState.showMoreButton !== this.state.showMoreButton;
    }

    private processUsername(username: string): String {
        return username.replace(/[^\w+$]/g, '');
    }

    private onLinkPressed(p_url: string, p_match: any) {
        const linkType = p_match.getType();

        switch (linkType) {
            case 'url':
                const postLink = 'bitclout.com/posts/';
                const isPostLink = p_url.includes(postLink);

                if (isPostLink) {
                    const postHashHexStartIndex = p_url.indexOf(postLink) + postLink.length;
                    const postHashHex = p_url.slice(postHashHexStartIndex, postHashHexStartIndex + 64);
                    (this.props.navigation as any).push(
                        'Post',
                        {
                            postHashHex: postHashHex,
                            key: 'Post_' + postHashHex
                        }
                    );
                } else {
                    if (!p_url.startsWith('https://') && !p_url.startsWith('https://')) {
                        p_url = 'https://' + p_url;
                    }
                    Linking.openURL(p_url).catch(() => { });
                }
                break;
            case 'mention':
                const userName = this.processUsername(p_url.slice(1));
                (this.props.navigation as any).push(
                    'UserProfile',
                    {
                        username: userName,
                        navigateByUsername: true,
                        key: 'Post_' + userName
                    }
                );
                break;
            case 'hashtag':
                return (this.props.navigation as any).push(
                    'CloutTagPosts',
                    {
                        cloutTag: p_match.hashtag,
                        key: 'CloutTag_' + p_match.hashtag
                    }
                );
        }
    }

    private renderLink(p_text: string) {
        const postLink = 'bitclout.com/posts/';
        const isPostLink = p_text.includes(postLink);

        if (isPostLink) {
            return 'Go to Post';
        } else {
            return p_text;
        }
    }

    private toggleText() {
        const textHidden = !this.state.textHidden;
        this.setState(
            {
                textHidden,
                numberOfLines: textHidden ? this.props.numberOfLines : undefined
            }
        );
    }

    private onTextLayout(e: any) {
        if (this._textInit) {
            return;
        }

        this._textInit = true;

        const linesLength = e.nativeEvent.lines.length;
        const showMoreButton = this.props.numberOfLines != null && linesLength > this.props.numberOfLines;

        this.setState(
            {
                showMoreButton,
                numberOfLines: showMoreButton ? this.props.numberOfLines : undefined
            }
        );
    }

    render() {
        const style = this.props.style ? this.props.style : [];

        return <>
            <Autolink
                style={style}
                text={this.props.text}
                onTextLayout={this.onTextLayout}
                mention="twitter"
                hashtag="twitter"
                numberOfLines={this.state.numberOfLines}
                renderLink={(text, match, index) => (
                    <Text
                        style={[styles.link, themeStyles.linkColor]}
                        key={index}
                        onPress={() => this.onLinkPressed(text, match)}
                    >
                        {this.renderLink(text)}

                    </Text>
                )}
            />
            {
                this.state.showMoreButton &&
                <Text
                    onPress={this.toggleText}
                    style={[themeStyles.linkColor, styles.readMore, this.props.isProfile && styles.isProfile]}
                >{this.state.textHidden ? 'Read More' : 'Read Less'}</Text>}
        </>
    }
}

const styles = StyleSheet.create(
    {
        link: {
            fontWeight: '500'
        },
        readMore: {
            paddingLeft: 10,
        },
        isProfile: {
            fontSize: 12,
            paddingLeft: 0,
            paddingTop: 5,
        }
    }
);
