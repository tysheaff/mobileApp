import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Badge, EventType } from '@types';
import { globals } from '@globals/globals';
import { signing } from '@services/authorization/signing';
import { eventManager } from '@globals/injector';
import { ParamListBase } from '@react-navigation/native';
import { bitBadgesApi } from '@services/api/bitBadgesApi';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    badge: Badge;
    toggleLoading: (loading: boolean) => void;
    endAction: (message: string) => void;
}

export class PendingAdditionalOptions extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.acceptAll = this.acceptAll.bind(this);
        this.declineAll = this.declineAll.bind(this);
        this.getConfirmation = this.getConfirmation.bind(this);
        this.showOptions = this.showOptions.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.badge?.id !== this.props.badge?.id;
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

    private async declineAll() {
        try {
            this.props.toggleLoading(true);
            const issuer = this.props.badge?.issuer;
            let pendingIds: string[] = [];

            const jwt = await signing.signJWT();

            await bitBadgesApi.getUser(globals.user.publicKey).then((res) => {
                pendingIds = res.badgesPending;
            });

            const confirmed = await this.getConfirmation(
                'Decline All Confirmation',
                'Are you sure you would like to decline all badges from this user?'
            );
            if (!confirmed) {
                this.props.toggleLoading(false);
                return;
            }

            const pendingData = await bitBadgesApi.getBadges(pendingIds);
            const declinedIds: string[] = [];
            for (const currBadge of pendingData.badges) {
                if (currBadge.issuer === issuer) {
                    await bitBadgesApi.declineBadge(
                        currBadge.id,
                        globals.user.publicKey,
                        jwt
                    );
                    declinedIds.push(currBadge.id);
                }
            }

            eventManager.dispatchEvent(EventType.RemovePendingBadges, declinedIds);

            this.props.endAction('Declined All. Please Refresh');
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async acceptAll() {
        try {
            this.props.toggleLoading(true);
            const issuer = this.props.badge?.issuer;

            let pendingIds: Array<string> = [];

            const jwt = await signing.signJWT();

            await bitBadgesApi.getUser(globals.user.publicKey).then((res) => {
                pendingIds = res.badgesPending;
            });

            const confirmed = await this.getConfirmation(
                'Accept All Confirmation',
                'Are you sure you would like to accept all badges from this user?'
            );
            if (!confirmed) {
                this.props.toggleLoading(false);
                return;
            }

            const pendingData = await bitBadgesApi.getBadges(pendingIds);
            const acceptedIds: string[] = [];
            for (const currBadge of pendingData.badges) {
                if (currBadge.issuer === issuer) {
                    await bitBadgesApi.acceptBadge(
                        currBadge.id,
                        globals.user.publicKey,
                        jwt
                    );
                    acceptedIds.push(currBadge.id);
                }
            }

            eventManager.dispatchEvent(EventType.RemovePendingBadges, acceptedIds);
            this.props.endAction('Accepted All. Please Refresh');
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private showOptions() {
        const options = ['Accept All From User', 'Decline All From User', ''];

        const callback = async (p_optionIndex: number) => {
            switch (p_optionIndex) {
                case 0:
                    await this.acceptAll();
                    break;
                case 1:
                    await this.declineAll();
                    break;
            }
        };
        eventManager.dispatchEvent(EventType.ToggleActionSheet, {
            visible: true,
            config: { options, callback, destructiveButtonIndex: [1] },
        });
    }

    render() {
        return <TouchableOpacity activeOpacity={1} onPress={this.showOptions.bind(this)}>
            <Feather name="more-horizontal" size={20} color="#a1a1a1" />
        </TouchableOpacity>;
    }
}
