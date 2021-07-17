import React from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';
import { themeStyles } from '@styles';
import { SelectListControl } from '@controls/selectList.control';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import { eventManager } from '@globals/injector';
import { EventType, ToggleCloutCastFeedEvent } from '@types';

enum FeedType {
    Hot = 'Hot',
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent',
}

interface State {
    isCloutCastEnabled: boolean;
    feed: FeedType;
}

export class FeedSettingsScreen extends React.Component<Record<string, never>, State>{

    private _isMounted = false;

    constructor(props: Record<string, never>) {
        super(props);

        this.state = {
            isCloutCastEnabled: true,
            feed: FeedType.Global
        };

        this.toggleCloutCastFeed = this.toggleCloutCastFeed.bind(this);
        this.onFeedTypeChange = this.onFeedTypeChange.bind(this);
        this.initScreen();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    toggleCloutCastFeed(): void {
        const newValue = !this.state.isCloutCastEnabled;
        this.setState({ isCloutCastEnabled: newValue });

        const event: ToggleCloutCastFeedEvent = { active: newValue };
        eventManager.dispatchEvent(EventType.ToggleCloutCastFeed, event);
        const key = globals.user.publicKey + constants.localStorage_cloutCastFeedEnabled;
        SecureStore.setItemAsync(key, String(newValue)).catch(() => undefined);
    }

    onFeedTypeChange(p_type: FeedType): void {
        this.setState({ feed: p_type });

        const key = globals.user.publicKey + constants.localStorage_defaultFeed;
        SecureStore.setItemAsync(key, String(p_type)).catch(() => undefined);
    }

    async initScreen(): Promise<void> {
        const feedKey = globals.user.publicKey + constants.localStorage_defaultFeed;
        const feed = await SecureStore.getItemAsync(feedKey).catch(() => undefined) as FeedType;

        const key = globals.user.publicKey + constants.localStorage_cloutCastFeedEnabled;
        const isCloutCastEnabledString = await SecureStore.getItemAsync(key).catch(() => undefined);

        if (this._isMounted) {
            this.setState(
                {
                    isCloutCastEnabled: isCloutCastEnabledString === 'true',
                    feed: feed ? feed : FeedType.Global
                }
            );
        }
    }

    render(): JSX.Element {
        return <View style={[styles.container, themeStyles.containerColorMain]} >
            <View style={themeStyles.containerColorMain}>
                {
                    globals.readonly ? undefined :
                        <View style={[styles.cloutCastFeedSettingsContainer, themeStyles.borderColor]}>
                            <Text style={[styles.cloutCastFeedSettingsText, themeStyles.fontColorMain]}>CloutCast Feed</Text>
                            <Switch
                                trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                                thumbColor={'white'}
                                ios_backgroundColor={themeStyles.switchColor.color}
                                onValueChange={() => this.toggleCloutCastFeed()}
                                value={this.state.isCloutCastEnabled}
                            />
                        </View>
                }
                <View>
                    <Text style={[styles.defaultFeedTitle, themeStyles.fontColorMain]}>Default Feed</Text>
                </View>
                <SelectListControl
                    style={[styles.selectList, themeStyles.borderColor]}
                    options={[
                        {
                            name: 'Hot',
                            value: FeedType.Hot
                        },
                        {
                            name: 'Global',
                            value: FeedType.Global
                        },
                        {
                            name: 'Following',
                            value: FeedType.Following
                        },
                        {
                            name: 'Recent',
                            value: FeedType.Recent
                        }
                    ]}
                    value={this.state.feed}
                    onValueChange={(value: string | string[]) => this.onFeedTypeChange(value as FeedType)}
                >
                </SelectListControl>
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        cloutCastFeedSettingsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 15,
            borderBottomWidth: 1
        },
        cloutCastFeedSettingsText: {
            fontWeight: '600',
            fontSize: 16
        },
        selectList: {
            borderBottomWidth: 1
        },
        defaultFeedTitle: {
            marginTop: 15,
            marginBottom: 5,
            fontSize: 18,
            paddingLeft: 15,
            fontWeight: '700'
        }
    }
);
