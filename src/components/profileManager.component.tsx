import { api } from '@services';
import { authentication } from '@services/authorization/authentication';
import { getAnonymousProfile } from '@services/helpers';
import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { Profile } from '@types';
import { globals } from '@globals/globals';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { AntDesign } from '@expo/vector-icons';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';
import { eventManager } from '@globals/injector';
import { EventType } from '@types';
import { FlatList } from 'react-native-gesture-handler';
import ProfileInfoCardComponent from './profileInfo/profileInfoCard.component';

interface Props {
    navigation: NavigationProp<ParamListBase>;
}

interface State {
    loading: boolean;
    visible: boolean;
    profiles: Profile[];
}

export class ProfileManagerComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: true,
            visible: true,
            profiles: []
        };

        this.loadData();

        this.selectAccount = this.selectAccount.bind(this);
        this.addCount = this.addCount.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private async loadData() {
        try {
            const publicKeys = await authentication.getAuthenticatedUserPublicKeys();

            const requests = publicKeys?.map(publicKey => api.getSingleProfile('', publicKey).catch(() => ({ Profile: getAnonymousProfile(publicKey) })));
            const response = await Promise.all(requests);

            const profiles: Profile[] = response.map(response => response.Profile);

            for (let i = 0; i < profiles.length; i++) {
                if (!profiles[i]) {
                    profiles[i] = getAnonymousProfile(publicKeys[i]);
                }
            }

            if (this._isMounted) {
                this.setState({ loading: false, profiles });
            }
        } catch (exception) {
            globals.defaultHandleError(exception);
            if (this._isMounted) {
                this.close();
            }
        }

    }

    private async selectAccount(publicKey: string) {
        this.close(false);
        await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
        await SecureStore.setItemAsync(constants.localStorage_readonly, 'false');
        globals.user = { publicKey, username: '' };
        globals.readonly = false;
        globals.onLoginSuccess();
    }

    private addCount() {
        this.close(false);
        this.props.navigation.navigate('Identity', { addAccount: true });
    }

    private close(p_animated = true) {
        if (this._isMounted && p_animated) {
            this.setState({ visible: false });
        }

        const timeout = p_animated ? 1000 : 0;
        setTimeout(() => eventManager.dispatchEvent(EventType.ToggleProfileManager, { visible: false }), timeout);
    }

    render(): JSX.Element {

        const renderItem = (item: Profile, index: number) =>
            <TouchableOpacity
                style={[styles.profileListCard, themeStyles.borderColor]}
                onPress={() => this.selectAccount(item.PublicKeyBase58Check)}
                activeOpacity={0.7}
                key={item.PublicKeyBase58Check + String(index)}
            >
                <ProfileInfoCardComponent
                    publicKey={item?.PublicKeyBase58Check}
                    username={item?.Username}
                    coinPrice={calculateAndFormatBitCloutInUsd(item.CoinPriceBitCloutNanos)}
                    verified={item?.IsVerified}
                    isProfileManager={true}
                />
                {
                    item.PublicKeyBase58Check === globals.user.publicKey &&
                    <AntDesign style={styles.icon} name="checkcircle" size={24} color="#007ef5" />
                }
            </TouchableOpacity>;

        const renderFooter = <TouchableOpacity
            style={styles.addAccountButton}
            activeOpacity={0.7}
            onPress={() => this.addCount()}
        >
            <AntDesign style={styles.addAccountButtonIcon} name="plus" size={22} color={themeStyles.fontColorMain.color} />
            <Text style={[styles.addAccountButtonText, themeStyles.fontColorMain]}>Add Account</Text>
        </TouchableOpacity>;

        const keyExtractor = (item: Profile, index: number) => `${item.PublicKeyBase58Check}_${index}`;

        return <Modal
            style={styles.modal}
            animationIn={'slideInUp'}
            isVisible={this.state.visible}
            swipeDirection='down'
            animationOutTiming={200}
            onSwipeComplete={() => { this.close(); }}
            onBackdropPress={() => { this.close(); }}
            onBackButtonPress={() => { this.close(); }}
            propagateSwipe={this.state.profiles?.length > 5}
        >
            <View style={[styles.container, themeStyles.modalBackgroundColor]}>
                {
                    this.state.loading ?
                        <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator>
                        :
                        <>
                            <FlatList
                                bounces={false}
                                data={this.state.profiles}
                                keyExtractor={keyExtractor}
                                renderItem={({ item, index }) => renderItem(item, index)}
                                ListFooterComponent={renderFooter}
                            />
                        </>
                }
            </View>
        </Modal>;
    }
}

const styles = StyleSheet.create(
    {
        modal: {
            width: '100%',
            marginLeft: 0,
            marginBottom: 0
        },
        container: {
            minHeight: '40%',
            maxHeight: '75%',
            marginTop: 'auto',
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            paddingTop: 16,
            paddingBottom: 50
        },
        profileListCard: {
            flexDirection: 'row',
            paddingVertical: 16,
            paddingHorizontal: 12,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center'
        },
        addAccountButton: {
            paddingVertical: 20,
            paddingLeft: 10,
            flexDirection: 'row',
            alignItems: 'center'
        },
        addAccountButtonIcon: {
            marginLeft: 11,
            marginRight: 18
        },
        addAccountButtonText: {
            fontWeight: '500'
        },
        icon: {
            marginLeft: 'auto'
        }
    }
);
