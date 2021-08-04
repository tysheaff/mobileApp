import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { ParamListBase } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { TextWithLinks } from '@components/textWithLinks.component';
import { api, cache, formatNumber } from '@services';
import { eventManager, globals, settingsGlobals } from '@globals';
import { ChangeFollowersEvent, EventType, Profile, User } from '@types';
import { themeStyles } from '@styles';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    profile: Profile;
    coinPrice: number;
}

interface State {
    doUserHODL: boolean;
    followersNumber: number | undefined;
    followingNumber: number | undefined;
    founderReward: string;
    formattedCoinPrice: string;
}

export class ProfileCard extends React.Component<Props, State> {

    private _isMounted = true;

    private _unsubscribes: (() => void)[] = [];

    constructor(props: Props) {
        super(props);

        const founderReward = this.props.profile.CoinEntry.CreatorBasisPoints / 100;
        let formattedFounderReward;
        if (Number.isInteger(founderReward)) {
            formattedFounderReward = founderReward.toString();
        } else {
            formattedFounderReward = founderReward.toFixed(1);
        }

        const formattedCoinPrice = formatNumber(this.props.coinPrice);

        this.state = {
            doUserHODL: false,
            followingNumber: undefined,
            followersNumber: undefined,
            founderReward: formattedFounderReward,
            formattedCoinPrice: formattedCoinPrice
        };

        const unsubscribeIncreaseFollowers = eventManager.addEventListener(
            EventType.IncreaseFollowers,
            (event: ChangeFollowersEvent) => {
                if (event.publicKey === this.props.profile.PublicKeyBase58Check) {
                    if (this._isMounted) {
                        this.setState(
                            previousState => (
                                {
                                    followersNumber: (previousState.followersNumber ?? 0) + 1
                                }
                            )
                        );
                    }
                }
            }
        );

        const unsubscribeDecreaseFollowers = eventManager.addEventListener(
            EventType.DecreaseFollowers,
            (event: ChangeFollowersEvent) => {
                if (event.publicKey === this.props.profile.PublicKeyBase58Check) {
                    if (this._isMounted) {
                        this.setState(
                            previousState => (
                                {
                                    followersNumber: (previousState.followersNumber ?? 1) - 1
                                }
                            )
                        );
                    }
                }
            }
        );

        this._unsubscribes.push(unsubscribeIncreaseFollowers, unsubscribeDecreaseFollowers);

        this.loadFollowers();

        this.goToFollowersScreen = this.goToFollowersScreen.bind(this);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        return this.props.profile?.PublicKeyBase58Check !== nextProps.profile?.PublicKeyBase58Check ||
            this.state.followersNumber !== nextState.followersNumber;
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
        for (const unsubscribe of this._unsubscribes) {
            unsubscribe();
        }
    }

    private async loadFollowers(): Promise<void> {
        const requests = [
            api.getProfileFollowers('', this.props.profile.Username, '', 0),
            api.getProfileFollowing('', this.props.profile.Username, '', 0)
        ];

        if (this.props.profile.PublicKeyBase58Check !== globals.user.publicKey) {
            requests.push(cache.user.getData());
        }

        await Promise.all(requests).then(
            responses => {

                let doUserHODL = false;

                if (responses.length === 3) {
                    const user: User = responses[2];
                    const userHODLs = user.UsersWhoHODLYou?.find(user => user.HODLerPublicKeyBase58Check === this.props.profile.PublicKeyBase58Check);
                    doUserHODL = !!userHODLs && userHODLs.HasPurchased;
                }

                if (this._isMounted) {
                    this.setState(
                        {
                            followersNumber: responses[0].NumFollowers,
                            followingNumber: responses[1].NumFollowers,
                            doUserHODL: doUserHODL
                        }
                    );
                }
            }
        ).catch(
            response => globals.defaultHandleError(response)
        );
    }

    private goToFollowersScreen(selectedTab: string): void {

        this.props.navigation.push(
            'ProfileFollowersTab',
            {
                publicKey: this.props.profile.PublicKeyBase58Check,
                username: this.props.profile.Username,
                selectedTab: selectedTab,
                followersNumber: this.state.followersNumber,
                followingNumber: this.state.followingNumber
            }
        );
    }

    private goToCreatorCoinScreen(): void {
        this.props.navigation.push(
            'CreatorCoin',
            {
                publicKey: this.props.profile.PublicKeyBase58Check,
                username: this.props.profile.Username,
                profilePic: this.props.profile.ProfilePic,
                isVerified: this.props.profile.IsVerified,
                currentCoinPrice: this.props.coinPrice
            }
        );
    }

    private goToBitBadgesScreen(p_selectedTab: string) {
        this.props.navigation.push('BitBadges',
            {
                publicKey: this.props.profile.PublicKeyBase58Check,
                username: this.props.profile.Username,
                selectedTab: p_selectedTab,
            }
        );
    }

    render(): JSX.Element {
        return <View style={[styles.container, themeStyles.containerColorMain, themeStyles.shadowColor]}>
            <View style={[styles.headerContainer]}>
                <View style={[styles.bitBadgesContainer]}>
                    <TouchableOpacity
                        onPress={() => this.goToBitBadgesScreen('received')}
                        style={[styles.bitBadgesButton, themeStyles.containerColorSub]}
                    >
                        <Image
                            style={styles.bitBadgesLogo}
                            source={{ uri: 'https://bitbadges.web.app/img/icons/logo.png' }}
                        />

                        <Text
                            style={[styles.founderRewardText, themeStyles.fontColorMain]}
                        >
                            BitBadges
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.foundRewardContainer}>
                    {
                        this.state.doUserHODL &&
                        < AntDesign name={'star'} size={16} color={'#ffdb58'} />
                    }

                    <View style={[styles.foundRewardContainer, themeStyles.containerColorSub]}>
                        <Text style={[styles.founderRewardText, themeStyles.fontColorMain]}>{this.state.founderReward}
                            <Text style={styles.percentage}>%</Text>
                        </Text>
                    </View>
                </View>
            </View>
            <Image style={styles.profilePic} source={{ uri: this.props.profile.ProfilePic }} />

            <View style={styles.usernameContainer}>
                <Text style={[styles.username, themeStyles.fontColorMain]} selectable={true}>{this.props.profile.Username}</Text>
                {
                    this.props.profile.IsVerified &&
                    <MaterialIcons style={styles.verifiedIcon} name="verified" size={16} color="#007ef5" />
                }
            </View>

            <View style={styles.description}>
                <TextWithLinks
                    navigation={this.props.navigation}
                    isProfile
                    numberOfLines={5}
                    style={[styles.description, themeStyles.fontColorSub]}
                    text={this.props.profile.Description}
                />
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.infoTextContainer}>
                    <TouchableOpacity
                        style={styles.infoButton}
                        activeOpacity={1}
                        onPress={() => this.goToFollowersScreen('Followers')}>
                        <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Followers</Text>
                        {
                            this.state.followersNumber != null ?
                                < Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>{formatNumber(this.state.followersNumber, false)}</Text>
                                :
                                <ActivityIndicator color={themeStyles.fontColorMain.color} style={styles.activityIndicator} />
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBorder} />

                <View style={styles.infoTextContainer}>
                    <TouchableOpacity
                        style={styles.infoButton}
                        activeOpacity={1}
                        onPress={() => this.goToFollowersScreen('Following')}>
                        <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Following</Text>
                        {
                            this.state.followingNumber != null ?
                                <Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>{formatNumber(this.state.followingNumber, false)}</Text>
                                : <ActivityIndicator color={themeStyles.fontColorMain.color} style={styles.activityIndicator} />
                        }
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBorder} />

                <View style={styles.infoTextContainer}>
                    <TouchableOpacity
                        style={styles.infoButton}
                        activeOpacity={1}
                        onPress={() => this.goToCreatorCoinScreen()}>
                        <Text style={[styles.infoTextLabel, themeStyles.fontColorSub]}>Coin Price</Text>
                        <Text style={[styles.infoTextNumber, themeStyles.fontColorMain]}>${this.state.formattedCoinPrice}</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 5,
            paddingHorizontal: 10,
            borderRadius: 8,
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 1,
            shadowRadius: 1,
            elevation: 1
        },
        profilePic: {
            marginBottom: 16,
            width: 60,
            height: 60,
            borderRadius: 8
        },
        usernameContainer: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        username: {
            fontWeight: 'bold',
            marginBottom: 6,
            fontSize: 20,
            marginRight: 6
        },
        description: {
            maxWidth: Dimensions.get('window').width * 0.7,
            fontSize: 12
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            alignSelf: 'stretch',
            marginVertical: 12,
        },
        infoTextContainer: {
            paddingVertical: 16,
            flex: 1,
            alignItems: 'center',
        },
        infoButton: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        },
        infoTextNumber: {
            fontSize: 20,
            fontWeight: 'bold'
        },
        infoTextLabel: {
            fontSize: 12,
            marginBottom: 4
        },
        infoBorder: {
            height: 40,
            width: 1,
            backgroundColor: settingsGlobals.darkMode ? '#3b3b3b' : '#e0e0e0'
        },
        foundRewardContainer: {
            paddingVertical: 5,
            paddingHorizontal: 6,
            borderRadius: 4,
            marginLeft: 6
        },
        founderRewardText: {
            fontSize: 10,
            fontWeight: '700'
        },
        percentage: {
            fontSize: 9
        },
        verifiedIcon: {
            marginBottom: 2
        },
        activityIndicator: {
            marginTop: 4
        },
        headerContainer: {
            width: Dimensions.get('window').width,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingLeft: 12,
            paddingRight: 12,
        },
        bitBadgesLogo: {
            width: 14,
            height: 14,
        },
        bitBadgesContainer: {
            paddingVertical: 5,
            paddingHorizontal: 6,
            borderRadius: 4,
        },
        bitBadgesButton: {
            paddingTop: 5,
            paddingBottom: 5,
            paddingRight: 6,
            paddingLeft: 6,
            borderRadius: 4,
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
        },
    }
);
