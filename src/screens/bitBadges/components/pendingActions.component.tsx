import React from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { Badge, EventType } from '@types';
import { ParamListBase } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { signing } from '@services/authorization/signing';
import { bitBadgesApi } from '@services/api/bitBadgesApi';
import { globals } from '@globals/globals';
import { PendingAdditionalOptions } from '@screens/bitBadges/components/pendingAdditionalOptions.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { settingsGlobals } from '@globals/settingsGlobals';
import { StackNavigationProp } from '@react-navigation/stack';
import { eventManager } from '@globals/injector';

interface Props {
    badge: Badge;
    navigation: StackNavigationProp<ParamListBase>;
}

interface State {
    actionCompleted: string | null;
    isLoading: boolean;
}

export class PendingActions extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            actionCompleted: null,
        };

        this.handleAcceptBadge = this.handleAcceptBadge.bind(this);
        this.handleDeclineBadge = this.handleDeclineBadge.bind(this);
        this.getConfirmation = this.getConfirmation.bind(this);
        this.toggleLoading = this.toggleLoading.bind(this);
        this.endAction = this.endAction.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private getButtons = (resolve: (value: string) => void, reject: (value: string) => void) => [
        {
            text: 'No',
            onPress: () => {
                reject('User denied action');
            },
        },
        {
            text: 'Yes',
            onPress: () => {
                resolve('User approved action');
            },
        },
    ];

    private async handleAcceptBadge() {
        try {
            const confirmed = await this.getConfirmation(
                'Accept Confirmation',
                'Are you sure you would like to accept this badge?'
            );
            if (!confirmed) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: true });
            }

            const jwt = await signing.signJWT();

            await bitBadgesApi.acceptBadge(
                this.props.badge?.id,
                globals.user.publicKey,
                jwt
            );

            if (this._isMounted) {
                this.setState({ isLoading: false, actionCompleted: 'Accepted' });
            }

            eventManager.dispatchEvent(EventType.RemovePendingBadges, [this.props.badge.id]);
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async handleDeclineBadge() {
        try {
            const confirmed = await this.getConfirmation(
                'Decline Confirmation',
                'Are you sure you would like to decline this badge?'
            );
            if (!confirmed) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: true });
            }

            const jwt = await signing.signJWT();

            await bitBadgesApi.declineBadge(
                this.props.badge?.id,
                globals.user.publicKey,
                jwt
            );

            if (this._isMounted) {
                this.setState({ isLoading: false, actionCompleted: 'Declined' });
            }

            eventManager.dispatchEvent(EventType.RemovePendingBadges, [this.props.badge.id]);
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async getConfirmation(alertTitle: string, alertMessage: string) {
        let confirmed = false;

        await new Promise((resolve, reject) => {
            Alert.alert(alertTitle, alertMessage, this.getButtons(resolve, reject), {
                cancelable: false,
            });
        })
            .then(() => (confirmed = true))
            .catch(() => (confirmed = false));

        return confirmed;
    }

    private toggleLoading(loading: boolean) {
        if (this._isMounted) {
            this.setState({ isLoading: loading });
        }
    }

    private endAction(message: string) {
        if (this._isMounted) {
            this.setState({
                isLoading: false,
                actionCompleted: message,
            });
        }
    }

    render() {
        if (this.state.isLoading) {
            return (
                <View style={styles.actionsContainer}>
                    <ActivityIndicator color={settingsGlobals.darkMode ? 'white' : 'gray'} />
                </View>
            );
        }

        return <View style={styles.actionsContainer}>
            {
                !this.state.actionCompleted ? <>
                    <CloutFeedButton styles={[styles.actionButton, themeStyles.buttonBorderColor]} title={'Decline'} onPress={this.handleDeclineBadge.bind(this)} />

                    <CloutFeedButton styles={[styles.actionButton, themeStyles.buttonBorderColor]} title={'Accept'} onPress={this.handleAcceptBadge.bind(this)} />

                    <PendingAdditionalOptions
                        navigation={this.props.navigation}
                        badge={this.props.badge}
                        toggleLoading={this.toggleLoading.bind(this)}
                        endAction={this.endAction.bind(this)}
                    />
                </>
                    : <Text style={[themeStyles.fontColorMain, styles.actionCompletedText]}>
                        {this.state.actionCompleted}
                    </Text>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        actionsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 16,
            minHeight: 60,
        },
        actionCompletedText: {
            fontSize: 16,
            fontWeight: '500'
        },
        actionButton: {
            marginHorizontal: 10,
            paddingHorizontal: 12,
            marginBottom: 0,
            width: 100,
        },
    }
);
