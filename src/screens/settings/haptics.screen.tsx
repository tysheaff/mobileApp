import React from 'react';
import { Text, StyleSheet, View, Switch } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import { themeStyles } from '@styles/globalColors';

interface State {
    areHapticsEnabled: boolean;
}

export default class HapticsScreen extends React.Component<Record<string, never>, State> {

    private _isMounted = false;

    constructor(props: Record<string, never>) {
        super(props);

        this.state = {
            areHapticsEnabled: false
        };

        this.toggleHaptics = this.toggleHaptics.bind(this);
        this.initScreen();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private async initScreen() {
        const hapticsKey = `${globals.user.publicKey}${constants.localStorage_cloutFeedHapticsEnabled}`;
        const areHapticsEnabledString = await SecureStore.getItemAsync(hapticsKey).catch(() => undefined);
        if (this._isMounted) {
            this.setState(
                {
                    areHapticsEnabled: !areHapticsEnabledString || areHapticsEnabledString === 'true'
                }
            );
        }
    }

    private toggleHaptics() {
        const newState = !this.state.areHapticsEnabled;
        globals.hapticsEnabled = newState;
        this.setState({ areHapticsEnabled: newState });
        const hapticsKey = `${globals.user.publicKey}${constants.localStorage_cloutFeedHapticsEnabled}`;
        SecureStore.setItemAsync(hapticsKey, String(newState)).catch(() => undefined);
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <View style={[styles.row, themeStyles.borderColor]}>
                <Text style={[themeStyles.fontColorMain, styles.optionText]}>Haptics Enabled</Text>
                <Switch
                    trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                    thumbColor={'white'}
                    ios_backgroundColor={themeStyles.switchColor.color}
                    onValueChange={() => this.toggleHaptics()}
                    value={this.state.areHapticsEnabled}
                />
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
        },
        optionText: {
            fontWeight: '600',
            fontSize: 16,
        }
    }
);
