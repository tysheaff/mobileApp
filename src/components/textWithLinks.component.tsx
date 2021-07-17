import React from 'react';
import { StyleSheet, Text, Linking, StyleProp, TextStyle } from 'react-native';
import Autolink from 'react-native-autolink';
import { themeStyles } from '@styles/globalColors';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    text: string;
    style?: StyleProp<TextStyle>[];
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

    private _isMounted = false;

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

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State): boolean {
        return p_nextProps.text !== this.props.text ||
            p_nextState.textHidden !== this.state.textHidden ||
            p_nextState.showMoreButton !== this.state.showMoreButton;
    }

    private processUsername(username: string): string {
        return username.replace(/[^\w+$]/g, '');
    }

    private onLinkPressed(p_url: string, p_match: Match) {
        const linkType = p_match.getType();
        switch (linkType) {
            case 'url': {
                const postLink = 'bitclout.com/posts/';
                const isPostLink = p_url.includes(postLink);

                if (isPostLink) {
                    const postHashHexStartIndex = p_url.indexOf(postLink) + postLink.length;
                    const postHashHex = p_url.slice(postHashHexStartIndex, postHashHexStartIndex + 64);
                    this.props.navigation.push(
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
                    Linking.openURL(p_url).catch(() => undefined);
                }
                break;
            }
            case 'mention': {
                const mentionUsername = this.processUsername(p_url.slice(1));
                this.props.navigation.push(
                    'UserProfile',
                    {
                        username: mentionUsername,
                        navigateByUsername: true,
                        key: 'Post_' + mentionUsername
                    }
                );
                break;
            }
            case 'hashtag':
                this.props.navigation.push(
                    'CloutTagPosts',
                    {
                        cloutTag: p_match.hashtag,
                        key: 'CloutTag_' + p_match.hashtag
                    }
                );
                break;
            case 'dollar': {
                const dollarUsername = this.processUsername(p_url.slice(1));
                this.props.navigation.push(
                    'UserProfile',
                    {
                        username: dollarUsername,
                        navigateByUsername: true,
                        key: 'Post_' + dollarUsername
                    }
                );
                break;
            }
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

        if (this._isMounted) {
            this.setState(
                {
                    showMoreButton,
                    numberOfLines: showMoreButton ? this.props.numberOfLines : undefined
                }
            );
        }
    }

    render(): JSX.Element {

        const dollarMatches = {
            pattern: /\$+[_A-Za-z]+[0-9]*[^ :/@/w]/g,
            type: 'dollar',
            getLinkText: (replacerArgs: string[]) => `${replacerArgs[0]}`
        };

        const style = this.props.style ? this.props.style : [];

        return <>
            <Autolink
                style={style}
                text={this.props.text}
                onTextLayout={event => this.onTextLayout(event)}
                mention="twitter"
                hashtag="twitter"
                matchers={[dollarMatches]}
                numberOfLines={this.state.numberOfLines}
                renderLink={(text: string, match: any, index: number) => (
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
                    onPress={() => this.toggleText()}
                    style={[themeStyles.linkColor, styles.readMore, this.props.isProfile && styles.isProfile]}
                >{this.state.textHidden ? 'Read More' : 'Read Less'}</Text>}
        </>;
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
