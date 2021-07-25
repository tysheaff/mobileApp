import React from 'react';
import { StyleSheet, Text, Image, View, ScrollView, Linking, Dimensions } from 'react-native';
import { Badge } from '@types';
import { api } from '@services';
import { themeStyles } from '@styles';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { globals } from '@globals/globals';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { BitBadgesDetails } from '../components/bitBadgesDetails.component';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'badgeDetails'>;
}

type RouteParams = {
    badgeDetails: {
        badge: Badge;
        issuerString: string;
        recipientString: string;
    };
};

interface State {
    issuer: string;
    recipients: string[];
    recipientsStr: string;
}

export class BadgeScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            issuer: this.props.route.params.issuerString ? this.props.route.params.issuerString : 'Loading...',
            recipients: ['Loading...'],
            recipientsStr: this.props.route.params.recipientString ? this.props.route.params.recipientString : 'Loading...',
        };

        this.loadRecipients = this.loadRecipients.bind(this);
        this.loadIssuer = this.loadIssuer.bind(this);
        this.openOnIpfs = this.openOnIpfs.bind(this);

        if (!this.props.route.params.issuerString || this.props.route.params.issuerString === 'Loading...') {
            this.loadIssuer();
        }

        if (!this.props.route.params.recipientString || this.props.route.params.recipientString === 'Loading...') {
            this.loadRecipients();
        }
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return p_nextState.issuer !== this.state.issuer ||
            p_nextState.recipientsStr !== this.state.recipientsStr;
    }

    private async loadRecipients() {
        const recipientUsernames: string[] = [];

        try {
            const response = await api.getProfile(
                this.props.route.params.badge.recipients
            );

            const userList = response.UserList;
            for (const element of userList) {
                const profile = element.ProfileEntryResponse;
                if (profile) {
                    recipientUsernames.push(
                        profile.Username ? profile.Username : profile.PublicKeyBase58Check
                    );
                }
            }

            if (this._isMounted) {
                let recipientsStr = '';
                for (const elem of recipientUsernames) {
                    recipientsStr += '@' + elem + ' ';
                }

                this.setState({ recipientsStr, recipients: recipientUsernames });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async loadIssuer() {
        try {
            const response = await api.getProfile([
                this.props.route.params.badge.issuer,
            ]);

            const issuerProfile = response.UserList[0].ProfileEntryResponse;
            if (this._isMounted) {
                if (issuerProfile.Username) {
                    this.setState({ issuer: issuerProfile.Username });
                } else {
                    this.setState({ issuer: issuerProfile.PublicKeyBase58Check });
                }
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private openOnIpfs() {
        Linking.openURL(`https://ipfs.infura.io/ipfs/${this.props.route.params.badge.id}`);
    }

    render() {
        return <ScrollView style={[styles.scrollViewContainer, themeStyles.containerColorMain]} bounces={false}>
            <View
                style={[
                    styles.container,
                    themeStyles.containerColorMain,
                    themeStyles.shadowColor,
                    {
                        borderColor: this.props.route.params.badge.backgroundColor
                            ? this.props.route.params.badge.backgroundColor
                            : themeStyles.containerColorSub.backgroundColor,
                    },
                ]}
            >
                <View style={[styles.titleContainer]}>
                    <Text
                        style={[styles.title, themeStyles.fontColorMain]}
                        selectable={true}
                    >
                        {this.props.route.params.badge.title}
                    </Text>
                </View>

                <Image
                    style={[styles.profilePic]}
                    source={{ uri: this.props.route.params.badge.imageUrl }}
                />

                <View style={[styles.detailsContainer]}>
                    <BitBadgesDetails
                        text={this.state.issuer === 'Loading...' ? this.state.issuer : '@' + this.state.issuer}
                        navigation={this.props.navigation}
                        label={'Issuer: '}
                    />

                    <BitBadgesDetails
                        text={this.state.recipientsStr}
                        navigation={this.props.navigation}
                        label={'Recipients: '}
                    />

                    {
                        !!this.props.route.params.badge.description && <BitBadgesDetails
                            text={this.props.route.params.badge.description}
                            navigation={this.props.navigation}
                            label={'Description: '}
                        />
                    }

                    {
                        !!this.props.route.params.badge.externalUrl && <BitBadgesDetails
                            text={this.props.route.params.badge.externalUrl}
                            navigation={this.props.navigation}
                            label={'URL: '}
                        />
                    }

                    <View style={[styles.details]}>
                        <Text style={[styles.detailsLabel, themeStyles.fontColorMain]}>
                            Current Status:{' '}
                        </Text>
                        {
                            Date.now() < this.props.route.params.badge.validDateEnd &&
                                Date.now() > this.props.route.params.badge.validDateStart ? <View style={[styles.validIconContainer]}>
                                <Text
                                    style={[themeStyles.fontColorMain, styles.validityText]}
                                >
                                    Valid
                                </Text>
                                <AntDesign size={14} name="checkcircle" color="green" />
                            </View>
                                : <View style={[styles.validIconContainer]}>
                                    <Text
                                        style={[themeStyles.fontColorMain, styles.validityText]}
                                    >
                                        Invalid
                                    </Text>
                                    <MaterialIcons size={14} name="report-problem" color="red" />
                                </View>
                        }
                    </View>

                    <BitBadgesDetails
                        text={new Date(
                            this.props.route.params.badge.validDateStart
                        ).toLocaleDateString()}
                        navigation={this.props.navigation}
                        label={'Valid From: '}
                    />

                    <BitBadgesDetails
                        text={
                            this.props.route.params.badge.validDates
                                ? new Date(
                                    this.props.route.params.badge.validDateEnd
                                ).toLocaleDateString()
                                : 'Forever'
                        }
                        navigation={this.props.navigation}
                        label={'Valid Until: '}
                    />

                    <BitBadgesDetails
                        text={new Date(
                            this.props.route.params.badge.dateCreated
                        ).toLocaleDateString()}
                        navigation={this.props.navigation}
                        label={'Date Created: '}
                    />

                    <CloutFeedButton
                        styles={styles.button}
                        title={'View on IPFS'}
                        onPress={this.openOnIpfs.bind(this)}
                    />
                </View>
            </View>
        </ScrollView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            alignItems: 'center',
            paddingTop: 5,
            paddingHorizontal: 10,
            borderRadius: 8,
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 1,
            shadowRadius: 1,
            margin: 5,
            borderWidth: 5,
        },
        validIconContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        details: {
            fontSize: 12,
            flexDirection: 'row',
            padding: 5,
        },
        detailsLabel: {
            fontWeight: 'bold',
        },
        validityText: {
            paddingRight: 4,
        },
        button: {
            marginTop: 12,
            marginRight: 10,
            marginBottom: 8,
        },
        profilePic: {
            width: 80,
            height: 80,
            borderRadius: 8,
        },
        titleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        title: {
            fontWeight: 'bold',
            marginBottom: 6,
            fontSize: 30,
            textAlign: 'center',
            paddingBottom: 8,
        },
        detailsContainer: {
            paddingTop: 16,
            paddingBottom: 16,
            flex: 1,
            width: Dimensions.get('window').width * 0.8,
        },
        scrollViewContainer: {
            flex: 1
        }
    }
);
