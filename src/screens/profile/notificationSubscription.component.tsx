import React, { Component } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles/globalColors';
import { signing } from '@services/authorization/signing';
import { cloutFeedApi } from '@services';
import { globals } from '@globals/globals';
import Modal from 'react-native-modal';
import { SelectListControl } from '@controls/selectList.control';

enum NotificationType {
    Post = 'Post',
    FounderReward = 'FounderReward'
}

interface Props {
    publicKey: string;
}

interface State {
    isNotificationSubscriptionLoading: boolean;
    notificationModalVisible: boolean;
    subscribedNotifications: NotificationType[];
}

class NotificationSubscriptionComponent extends Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isNotificationSubscriptionLoading: true,
            notificationModalVisible: false,
            subscribedNotifications: []
        };

        this.getNotificationSubscriptions = this.getNotificationSubscriptions.bind(this);
        this.closeNotificationModal = this.closeNotificationModal.bind(this);
        this.subscribeNotifications = this.subscribeNotifications.bind(this);
        this.unSubscribeNotifications = this.unSubscribeNotifications.bind(this);
        this.onSubscribedNotificationChange = this.onSubscribedNotificationChange.bind(this);

        this.getNotificationSubscriptions();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async getNotificationSubscriptions(): Promise<void> {
        try {
            const jwt = await signing.signJWT();
            const response = await cloutFeedApi.getNotificationSubscriptions(globals.user.publicKey, jwt, this.props.publicKey);
            const subscribedNotifications = [];
            if (response.post === true) {
                subscribedNotifications.push(NotificationType.Post);
            }
            if (response.founderReward === true) {
                subscribedNotifications.push(NotificationType.FounderReward);
            }

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private openNotificationModal(): void {
        if (this._isMounted) {
            this.setState({
                notificationModalVisible: true
            });
        }
    }

    private closeNotificationModal(): void {
        if (this._isMounted) {
            this.setState({ notificationModalVisible: false });
        }
    }

    private async subscribeNotifications(p_notificationType: NotificationType): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isNotificationSubscriptionLoading: true });
            }

            const jwt = await signing.signJWT();
            await cloutFeedApi.subscribeNotifications(globals.user.publicKey, jwt, this.props.publicKey, p_notificationType);
            const subscribedNotifications = this.state.subscribedNotifications;
            subscribedNotifications.push(p_notificationType);

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async unSubscribeNotifications(p_notificationType: NotificationType): Promise<void> {
        try {
            if (this._isMounted) {
                this.setState({ isNotificationSubscriptionLoading: true });
            }

            const jwt = await signing.signJWT();
            await cloutFeedApi.unSubscribeNotifications(globals.user.publicKey, jwt, this.props.publicKey, p_notificationType);
            const subscribedNotifications = this.state.subscribedNotifications;
            const index = subscribedNotifications.findIndex((p_value) => p_value === p_notificationType);
            subscribedNotifications.splice(index, 1);

            if (this._isMounted) {
                this.setState({
                    subscribedNotifications,
                    isNotificationSubscriptionLoading: false
                });
            }
        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    private onSubscribedNotificationChange(p_value: string[]): void {
        const shouldSubscribePostNotification = p_value.includes(NotificationType.Post) && !this.state.subscribedNotifications.includes(NotificationType.Post);
        const shouldUnSubscribePostNotification = !p_value.includes(NotificationType.Post) && this.state.subscribedNotifications.includes(NotificationType.Post);
        const shouldSubscribeFRNotification = p_value.includes(NotificationType.FounderReward) && !this.state.subscribedNotifications.includes(NotificationType.FounderReward);
        const shouldUnSubscribeFRNotification = !p_value.includes(NotificationType.FounderReward) && this.state.subscribedNotifications.includes(NotificationType.FounderReward);

        if (shouldSubscribePostNotification) {
            this.subscribeNotifications(NotificationType.Post);
        } else if (shouldUnSubscribePostNotification) {
            this.unSubscribeNotifications(NotificationType.Post);
        } else if (shouldSubscribeFRNotification) {
            this.subscribeNotifications(NotificationType.FounderReward);
        } else if (shouldUnSubscribeFRNotification) {
            this.unSubscribeNotifications(NotificationType.FounderReward);
        }
    }

    render(): JSX.Element {
        return (
            <React.Fragment>
                <Ionicons name="md-notifications-outline" size={26} style={themeStyles.fontColorMain} onPress={() => this.openNotificationModal()} />
                {
                    this.state.subscribedNotifications?.length > 0 ?
                        <View style={styles.subscribedCircle}></View>
                        :
                        undefined
                }
                <Modal
                    style={[styles.modalStyle]}
                    animationIn='slideInUp'
                    isVisible={this.state.notificationModalVisible}
                    swipeDirection='down'
                    animationOutTiming={200}
                    onBackButtonPress={() => this.closeNotificationModal()}
                    onSwipeComplete={() => this.closeNotificationModal()}
                    onBackdropPress={() => this.closeNotificationModal()}
                >
                    <View style={[styles.mainContainer, themeStyles.containerColorSub]}>
                        <View style={[styles.headerContainer, themeStyles.borderColor]}>
                            <Text style={[styles.showText, themeStyles.fontColorMain]}>Notifications</Text>
                        </View>
                        {
                            this.state.isNotificationSubscriptionLoading ?
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator color={themeStyles.fontColorMain.color} />
                                </View> :
                                <View>
                                    <SelectListControl
                                        style={[styles.selectList]}
                                        options={[
                                            {
                                                name: 'Post',
                                                value: NotificationType.Post
                                            },
                                            {
                                                name: 'FR Change',
                                                value: NotificationType.FounderReward
                                            }
                                        ]}
                                        value={this.state.subscribedNotifications}
                                        onValueChange={(value: string | string[]) => this.onSubscribedNotificationChange(value as string[])}
                                        multiple={true}
                                    >
                                    </SelectListControl>
                                </View>
                        }
                    </View>
                </Modal>
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    subscribedCircle: {
        width: 6,
        height: 6,
        borderRadius: 10,
        backgroundColor: '#007ef5',
        position: 'absolute',
        left: 19,
        top: 2
    },
    selectList: {
        width: '100%'
    },
    modalStyle: {
        marginTop: 0,
        marginLeft: 0,
        marginBottom: 0,
        width: '100%'
    },
    mainContainer: {
        height: '40%',
        marginTop: 'auto',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 25,
    },
    headerContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 5
    },
    showText: {
        fontSize: 20,
        fontWeight: '700'
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default NotificationSubscriptionComponent;
