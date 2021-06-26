import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ProfileListCardComponent } from '../../components/profileListCard.component';
import { globals, navigatorGlobals } from '@globals';
import { Profile, User } from '@types';
import { api, cache, isNumber } from '@services';
import { themeStyles } from '@styles';
import { NavigationProp } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<any>;
}

interface State {
    isLoading: boolean;
    profiles: Profile[];
}

export class CreatorsSearchScreen extends React.Component<Props, State> {

    private _isMounted = false;
    private _timer: number | undefined = undefined;
    private _leaderBoard: Profile[] = [];
    private _lastUsernamePrefix: string = '';
    private _loggedInUserFollowingMap: { [key: string]: Profile } = {};
    private _focusSubscription: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            profiles: [],
        };

        this.init();

        this._focusSubscription = this.props.navigation.addListener(
            'focus',
            () => {
                this.setSearchMethod();

                if (this._leaderBoard.length && this._isMounted) {
                    this.setState({ profiles: this._leaderBoard });
                }
            }
        );
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this._focusSubscription();
    }

    setSearchMethod() {
        navigatorGlobals.searchResults = (p_usernamePrefix: string) => {
            this._lastUsernamePrefix = p_usernamePrefix;
            p_usernamePrefix = p_usernamePrefix.trim();

            if (isNumber(this._timer)) {
                window.clearTimeout(this._timer);
            }

            if (!p_usernamePrefix) {
                if (this._isMounted) {
                    this.setState({ profiles: this._leaderBoard, isLoading: false });
                }
            } else {
                if (this._isMounted) {
                    this.setState({ isLoading: true });
                }
                this._timer = window.setTimeout(
                    async () => {
                        try {
                            const usernamePrefixCopy = p_usernamePrefix;
                            const response = await api.searchProfiles(globals.user.publicKey, p_usernamePrefix);
                            let foundProfiles = response?.ProfilesFound;
                            if (!foundProfiles) {
                                foundProfiles = [];
                            }

                            if (this._isMounted && this._lastUsernamePrefix === usernamePrefixCopy) {
                                this.setState({ profiles: foundProfiles, isLoading: false });
                            }

                            this._timer = undefined;
                        }
                        catch (p_error) {
                            globals.defaultHandleError(p_error);
                        }
                    },
                    500
                );
            }
        };
    }

    async init() {
        try {
            const response = await Promise.all(
                [
                    api.getLeaderBoard(globals.user.publicKey),
                    cache.user.getData()
                ]
            );
            let foundProfiles = response[0]?.ProfilesFound;

            if (!foundProfiles) {
                foundProfiles = [];
            }

            if (this._isMounted) {
                this.setFollowedByUserMap(response[1]);
                this._leaderBoard = foundProfiles;
                this.setState({ profiles: foundProfiles, isLoading: false });
            }
        } catch (p_error) {
            globals.defaultHandleError(p_error);
        }
    }

    setFollowedByUserMap(p_user: User) {
        let followedByUserMap: any = {};
        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];
        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }
        this._loggedInUserFollowingMap = followedByUserMap;
    }

    render() {

        const renderItem = (item: Profile) =>
            <ProfileListCardComponent
                profile={item}
                isFollowing={!!this._loggedInUserFollowingMap[item.PublicKeyBase58Check]}
            />;
        const keyExtractor = (item: Profile, index: number) => `${item.PublicKeyBase58Check}_${index}`;

        return this.state.isLoading ?
            <View style={[styles.container, themeStyles.containerColorMain]}>
                <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color} />
            </View>
            :
            <View style={[styles.container, themeStyles.containerColorMain]}>
                {
                    this.state.profiles.length > 0 ?
                        <FlatList
                            data={this.state.profiles}
                            keyExtractor={keyExtractor}
                            renderItem={({ item }) => renderItem(item)}
                        />
                        :
                        <Text style={[styles.noProfilesText, themeStyles.fontColorSub]}>No results found</Text>
                }
            </View>
    }
}
const styles = StyleSheet.create(
    {
        activityIndicator: {
            marginTop: 175
        },
        container: {
            flex: 1
        },
        noProfilesText: {
            fontSize: 15,
            textAlign: 'center',
            marginTop: 40,
        }
    }
);