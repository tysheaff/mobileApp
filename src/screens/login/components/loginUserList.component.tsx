import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import { User } from '@types';
import { api, cache } from '@services';
import { getAnonymousProfile } from '@services/helpers';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    standardPublicKey: string;
    nonStandardPublicKey?: string;
    back: () => void;
    selectAccount: (publicKey: string) => void;
    navigation: StackNavigationProp<ParamListBase>;
}

interface State {
    loading: boolean;
    users: User[]
}

export class LoginUserListComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: true,
            users: []
        };

        this.loadUsers();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    async loadUsers(): Promise<void> {
        const publicKeys = [this.props.standardPublicKey];

        if (this.props.nonStandardPublicKey) {
            publicKeys.push(this.props.nonStandardPublicKey);
        }

        try {
            await cache.exchangeRate.getData();
            const response = await api.getProfile(publicKeys);

            const users = response.UserList as User[];

            if (users?.length > 1) {
                const nonStandardUser = users[1];

                const shouldAddNonStandardUser = nonStandardUser?.ProfileEntryResponse ||
                    nonStandardUser?.BalanceNanos > 0 ||
                    nonStandardUser?.UsersYouHODL?.length > 0;

                if (!shouldAddNonStandardUser) {
                    users.splice(1, 1);
                }
            }

            for (const user of users) {
                if (!user.ProfileEntryResponse) {
                    user.ProfileEntryResponse = getAnonymousProfile(user.PublicKeyBase58Check);
                } else {
                    user.ProfileEntryResponse.ProfilePic = api.getSingleProfileImage(user.PublicKeyBase58Check);
                }
            }

            if (this._isMounted) {
                this.setState(
                    {
                        loading: false,
                        users
                    }
                );
            }
        } catch {
            return;
        }
    }

    render(): JSX.Element {
        return <View style={styles.container}>
            {
                this.state.loading ?
                    <ActivityIndicator style={styles.activityIndicator} color={'#ebebeb'}></ActivityIndicator>
                    :
                    <View>
                        <Text style={styles.chooseAccountText}>Choose an Account</Text>
                        {
                            this.state.users.map(
                                (user, index) => <TouchableOpacity
                                    onPress={() => this.props.selectAccount(user.PublicKeyBase58Check)}
                                    activeOpacity={0.6} key={user.PublicKeyBase58Check + String(index)}>
                                    <View style={[styles.profileListCard]}>
                                        <ProfileInfoCardComponent
                                            navigation={this.props.navigation}
                                            profile={user.ProfileEntryResponse}
                                            ìsDarkMode={true}
                                            isProfileManager={true}
                                            peekDisabled={true}
                                        />
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                        <TouchableOpacity style={styles.backButton} onPress={this.props.back}>
                            <Text style={styles.backText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            backgroundColor: '#171717'
        },
        activityIndicator: {
            marginTop: 175
        },
        chooseAccountText: {
            color: '#ebebeb',
            marginBottom: 10,
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '25%'
        },
        profileListCard: {
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center',
            backgroundColor: 'black',
            borderColor: '#262626'
        },
        backText: {
            color: '#b0b3b8',
            marginBottom: 5,
            fontSize: 12
        },
        backButton: {
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 8
        }
    }
);
