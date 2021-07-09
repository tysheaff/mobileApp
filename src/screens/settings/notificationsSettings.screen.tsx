import React from 'react';
import { Text, StyleSheet, View, Switch, FlatList } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { cloutFeedApi, notificationsService } from '@services';
import { signing } from '@services/authorization/signing';
import { globals } from '@globals/globals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

enum NotificationSetting {
    Active = 'General',
    Like = 'Like',
    Follow = 'Follow',
    Comment = 'Comment',
    Mention = 'Mention',
    Reclout = 'Reclout',
    Monetary = 'Monetary',
    Diamond = 'Diamond'
}

type NotificationSettings = {
    [key in NotificationSetting]: boolean;
}

interface Props { }

interface State {
    isLoading: boolean;
    notificationSettings: NotificationSettings;
}

interface Option {
    title: string;
    state: boolean;
}

export default class NotificationsSettingsScreen extends React.Component<Props, State> {

    private _isMounted = false;
    private _jwt: string = '';
    private _interval: number = 0;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            notificationSettings: {
                General: false,
                Like: false,
                Follow: false,
                Comment: false,
                Mention: false,
                Reclout: false,
                Monetary: false,
                Diamond: false
            }
        };

        this.updateSettings = this.updateSettings.bind(this);
        this.initScreen();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        window.clearInterval(this._interval);
    }

    private async initScreen() {

        if (this._isMounted) {
            this.setState({ isLoading: true });
        }

        try {

            this._jwt = await signing.signJWT();
            this._interval = window.setInterval(async () => {
                this._jwt = await signing.signJWT();
            }, 55000);

            const response: any = await cloutFeedApi.getNotificationsSettings(globals.user.publicKey, this._jwt);
            if (this._isMounted) {
                this.setState(
                    {
                        notificationSettings:
                        {
                            General: response.active,
                            Like: response.like,
                            Follow: response.follow,
                            Comment: response.comment,
                            Mention: response.mention,
                            Reclout: response.reclout,
                            Monetary: response.monetary,
                            Diamond: response.diamond
                        }
                    }
                );
            }
        }
        catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false });
            }
        }
    }

    private async updateSettings(type: NotificationSetting, isActive: boolean) {
        if (type !== NotificationSetting.Active) {
            try {
                if (this._isMounted) {
                    this.setState(
                        prevState => {
                            const settings = prevState.notificationSettings;
                            (settings as any)[type] = !(settings as any)[type];
                            return { notificationSettings: settings };
                        }
                    );
                }
                await cloutFeedApi.updateNotificationsSettings(globals.user.publicKey, this._jwt, type, isActive);
            } catch (error) {
                if (this._isMounted) {
                    this.setState(
                        prevState => {
                            const settings = prevState.notificationSettings;
                            (settings as any)[type] = !(settings as any)[type];
                            return { notificationSettings: settings };
                        }
                    );
                }
            }
        } else {
            if (this._isMounted) {
                this.setState(
                    prevState => {
                        const settings = prevState.notificationSettings;
                        (settings as any)[type] = !(settings as any)[type];
                        return { notificationSettings: settings };
                    }
                );
                try {
                    if (this.state.notificationSettings.General) {
                        await cloutFeedApi.unregisterNotificationsPushToken(globals.user.publicKey, this._jwt);
                    } else {
                        await notificationsService.registerPushToken();
                    }
                } catch (error) {
                    this.setState(
                        prevState => {
                            const settings = prevState.notificationSettings;
                            (settings as any)[type] = !(settings as any)[type];
                            return { notificationSettings: settings };
                        }
                    );
                    globals.defaultHandleError(error);
                }
            }
        }
    }

    render() {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        const options: Option[] = Object.keys(this.state.notificationSettings).map(
            (key: string) => {
                return {
                    title: key,
                    state: (this.state.notificationSettings as any)[key]
                };
            }
        );

        const thumbColor: any = !this.state.notificationSettings.General ? themeStyles.buttonDisabledColor.backgroundColor : "white";
        const keyExtractor = (item: Option, index: number) => `${item}_${index.toString()}`;
        const renderItem = (item: Option) => <View style={[styles.row, themeStyles.containerColorMain, themeStyles.borderColor]}>
            <Text style={[styles.rowText, themeStyles.fontColorMain]}>{item.title}</Text>
            <Switch
                trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                thumbColor={thumbColor}
                ios_backgroundColor={themeStyles.switchColor.color}
                onValueChange={(newState) => this.updateSettings(item.title as NotificationSetting, newState)}
                value={item.state}
                disabled={item.title !== 'General' && !this.state.notificationSettings.General}
            />
        </View >;

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <FlatList
                data={options}
                keyExtractor={keyExtractor}
                renderItem={({ item }) => renderItem(item)}
            />
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
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            padding: 16,
        },
        rowText: {
            fontWeight: '600'
        }
    }
);
