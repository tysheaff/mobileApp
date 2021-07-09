import React from 'react';
import { Text, StyleSheet, View, Switch, FlatList } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { cloutFeedApi, notificationsService } from '@services';
import { signing } from '@services/authorization/signing';
import { globals } from '@globals/globals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

enum NotificationSetting {
    Active = 'Active',
    Like = 'Like',
    Follow = 'Follow',
    Comment = 'Comment',
    Mention = 'Mention',
    Reclout = 'Reclout',
    Diamond = 'Diamond',
    Monetary = 'Monetary'
}

type NotificationSettings = {
    [key in NotificationSetting]: boolean;
}

interface Props { }

interface State {
    isLoading: boolean;
    notificationSettings: NotificationSettings;
    permissionDenied: boolean;
}

interface Option {
    key: NotificationSetting;
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
                Active: false,
                Like: false,
                Follow: false,
                Comment: false,
                Mention: false,
                Reclout: false,
                Diamond: false,
                Monetary: false
            },
            permissionDenied: false
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
                        notificationSettings: {
                            Active: response.active,
                            Like: response.like,
                            Follow: response.follow,
                            Comment: response.comment,
                            Mention: response.mention,
                            Reclout: response.reclout,
                            Diamond: response.diamond,
                            Monetary: response.monetary
                        },
                        isLoading: false
                    }
                );
            }
        }
        catch (error) {
            if (error.json.errorId === 1) {
                if (this._isMounted) {
                    this.setState(
                        {
                            permissionDenied: true,
                            isLoading: false
                        }
                    );
                }
            } else {
                globals.defaultHandleError(error);
            }
        }
    }

    private async updateSettings(type: NotificationSetting, isActive: boolean) {
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
    }

    render() {

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        if (this.state.permissionDenied) {
            return <View style={[styles.permissionDeniedContainer, themeStyles.containerColorMain]}>
                <Text style={[themeStyles.fontColorMain, styles.permissionDeniedText]}>
                    Notifications permission not permitted. Please activate the notifications from the device settings and reload the application. 
                </Text>
            </View>
        }

        const options: Option[] = [
            {
                key: NotificationSetting.Active,
                title: 'Allow Notifications',
                state: this.state.notificationSettings.Active
            }
        ];

        if (this.state.notificationSettings.Active) {
            options.push(
                ...Object.keys(this.state.notificationSettings).slice(1).map(
                    (key: string) => {
                        return {
                            key: key as NotificationSetting,
                            title: key,
                            state: (this.state.notificationSettings as any)[key]
                        };
                    }
                )
            );
        }

        const keyExtractor = (item: Option, index: number) => `${item}_${index.toString()}`;
        const renderItem = (item: Option) => <View style={[styles.row, themeStyles.containerColorMain, themeStyles.borderColor]}>
            <Text style={[styles.rowText, themeStyles.fontColorMain]}>{item.title}</Text>
            <Switch
                trackColor={{ false: themeStyles.switchColor.color, true: '#007ef5' }}
                thumbColor={'white'}
                ios_backgroundColor={themeStyles.switchColor.color}
                onValueChange={(newState) => this.updateSettings(item.key, newState)}
                value={item.state}
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
        },
        permissionDeniedContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
        },
        permissionDeniedText: {
            fontSize: 16,
            textAlign: 'center',
            marginBottom: '20%'
        }
    }
);
