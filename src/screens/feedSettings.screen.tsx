import React from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Switch } from 'react-native'
import { themeStyles } from '@styles';
import { SelectListControl } from "@controls/selectList.control";
import * as SecureStore from 'expo-secure-store'
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';

enum FeedType {
    Global = 'Global',
    Following = 'Following',
    Recent = 'Recent',
}

interface Props { };

interface State {
    isCloutCastEnabled: boolean;
    feed: FeedType;
};

export class FeedSettingsScreen extends React.Component<Props, State>{

    private _isMounted = false;
    constructor(props: Props) {
        super(props);

        this.state = {
            isCloutCastEnabled: false,
            feed: FeedType.Global
        };

        this.toggleSwitch = this.toggleSwitch.bind(this);
        this.onFeedTypeChange = this.onFeedTypeChange.bind(this);
        this.initScreen();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    toggleSwitch() {
        this.setState({ isCloutCastEnabled: !this.state.isCloutCastEnabled });
        SecureStore.setItemAsync(`${globals.user.publicKey}_${constants.localStorage_cloutCastFeedEnabled}`, String(!this.state.isCloutCastEnabled)).catch(() => { });
    }

    onFeedTypeChange(p_type: FeedType) {
        this.setState({ feed: p_type });
        SecureStore.setItemAsync(`${globals.user.publicKey}_${constants.localStorage_defaultFeed}`, String(p_type)).catch(() => { });
    }

    async initScreen() {
        const feed = await SecureStore.getItemAsync(`${globals.user.publicKey}_${constants.localStorage_defaultFeed}`).catch(() => undefined) as FeedType;

        const isCloutCastEnabledString = await SecureStore.getItemAsync(`${globals.user.publicKey}_${constants.localStorage_cloutCastFeedEnabled}`).catch(() => undefined);

        if (this._isMounted) {
            this.setState({ isCloutCastEnabled: isCloutCastEnabledString === 'true', feed });
        }
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorSub]} >
            <View style={themeStyles.containerColorMain}>
                <View style={[styles.buttonContainer, themeStyles.borderColor]}>
                    <Text style={[styles.buttonText, themeStyles.fontColorMain]}>CloutCast Feed</Text>
                    <Switch
                        trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                        thumbColor={this.state.isCloutCastEnabled ? "white" : "white"}
                        ios_backgroundColor={themeStyles.switchColor.color}
                        onValueChange={this.toggleSwitch}
                        value={this.state.isCloutCastEnabled}
                    />
                </View>
                <View style={styles.selectList}>
                    <Text style={[styles.themeTitle, themeStyles.fontColorMain]}>Default Feed</Text>
                </View>
                <SelectListControl
                    style={[styles.selectList]}
                    options={[
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
                    onValueChange={this.onFeedTypeChange}
                >
                </SelectListControl>
            </View>
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16
    },
    selectList: {
        padding: 6,
    },
    themeTitle: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '700'
    }
})