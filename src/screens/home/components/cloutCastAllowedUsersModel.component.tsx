import { api } from "@services";
import { getAnonymousProfile } from "@services/helpers";
import { themeStyles } from "@styles/globalColors";
import React from "react";
import { TouchableOpacity, View, Image, Text, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { calculateAndFormatBitCloutInUsd } from "@services/bitCloutCalculator";
import { FlatList } from "react-native-gesture-handler";
import { settingsGlobals } from "@globals/settingsGlobals";
import { Profile } from "@types";
import { NavigationProp } from "@react-navigation/native";

interface Props {
    navigation: NavigationProp<any>;
    publicKeys: string[];
    close: () => void;
}

interface State {
    isLoading: boolean;
    profiles: Profile[];
}

export class CloutCastAllowedUsersModelComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            profiles: []
        };

        this.close = this.close.bind(this);
        this.loadData();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async loadData() {
        try {
            const promises: Promise<Profile>[] = [];
            for (const publicKey of this.props.publicKeys) {
                const promise = new Promise<Profile>(
                    (p_resolve, _reject) => {
                        api.getSingleProfile('', publicKey).then(
                            p_response => {
                                const profile: Profile = p_response.Profile;
                                profile.ProfilePic = api.getSingleProfileImage(publicKey);
                                p_resolve(profile);
                            }
                        ).catch(
                            () => p_resolve(getAnonymousProfile(publicKey))
                        );
                    }
                );
                promises.push(promise);
            }

            const profiles = await Promise.all(promises);

            if (this._isMounted) {
                this.setState({ profiles, isLoading: false });
            }
        } catch {
            this.props.close();
        }
    }

    close() {
        this.props.close();
    }

    render() {
        const keyExtractor = (item: Profile, index: number) => item.PublicKeyBase58Check + index;
        const renderItem = ({ item, index }: { item: Profile, index: number }) => (
            <TouchableOpacity
                onPress={
                    () => {
                        this.close();
                        (this.props.navigation as any).push(
                            'UserProfile',
                            {
                                publicKey: item.PublicKeyBase58Check,
                                username: item.Username,
                                key: 'Profile_' + item.PublicKeyBase58Check
                            }
                        );
                    }
                }
                activeOpacity={0.7} key={item.PublicKeyBase58Check + index}>
                <View style={[styles.profileListCard, themeStyles.borderColor]}>
                    <Image style={styles.profileImage}
                        source={{ uri: item.ProfilePic }}></Image>

                    <View>
                        <View style={styles.usernameContainer}>
                            <Text style={[styles.username, themeStyles.fontColorMain]}>{item.Username}</Text>
                            {
                                item.IsVerified ?
                                    <MaterialIcons name="verified" size={16} color="#007ef5" /> : undefined
                            }
                        </View>

                        <View style={[styles.profileCoinPriceContainer, { backgroundColor: settingsGlobals.darkMode ? '#171717' : '#ebebeb' }]}>
                            <Text
                                style={[styles.profileCoinPriceText, themeStyles.fontColorMain]}
                            >~${calculateAndFormatBitCloutInUsd(item.CoinPriceBitCloutNanos)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );

        return <Modal
            style={styles.modal}
            animationIn={'slideInUp'}
            isVisible={true}
            swipeDirection='down'
            animationOutTiming={200}
            onSwipeComplete={() => { this.close() }}
            onBackdropPress={() => { this.close() }}
            onBackButtonPress={() => { this.close() }}
            propagateSwipe={this.state.profiles?.length > 5}
        >
            <View style={[styles.container, themeStyles.modalBackgroundColor]}>
                {
                    this.state.isLoading ?
                        <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator>
                        :
                        <>
                            <FlatList
                                bounces={false}
                                data={this.state.profiles}
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                            >
                            </FlatList>
                        </>
                }
            </View>
        </Modal >;
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
            display: 'flex',
            flexDirection: 'row',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 12,
            paddingRight: 12,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            alignItems: 'center'
        },
        profileImage: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        },
        usernameContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2,
            marginRight: 6
        },
        profileCoinPriceContainer: {
            borderRadius: 12,
            paddingRight: 10,
            paddingLeft: 10,
            justifyContent: 'center',
            height: 20,
            alignSelf: 'flex-start',
            marginTop: 6
        },
        profileCoinPriceText: {
            fontSize: 10,
            fontWeight: '600'
        },
        addAccountButton: {
            paddingTop: 20,
            paddingBottom: 20,
            paddingLeft: 10,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        addAccountButtonIcon: {
            marginLeft: 11,
            marginRight: 18
        },
        addAccountButtonText: {
            fontWeight: '500'
        }
    }
);
