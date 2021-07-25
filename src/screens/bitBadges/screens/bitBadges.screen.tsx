import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, Image, RefreshControl, FlatList, ScrollView } from 'react-native';
import { globals } from '@globals/globals';
import { Badge, BitBadgesUserDetails, EventType, Profile } from '@types';
import { bitBadgesApi } from '@services/api/bitBadgesApi';
import { themeStyles } from '@styles';
import * as SecureStore from 'expo-secure-store';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { settingsGlobals } from '@globals/settingsGlobals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { BitBadgesIntroductionComponent } from '../components/bitBadgesIntro.component';
import { constants } from '@globals/constants';
import { PendingBar } from '../components/pendingBar.component';
import { BadgeListHeader } from '../components/badgeListHeader.component';
import { BitBadgesListCardComponent } from '../components/bitBadgesListCard.component';
import { TabsComponent } from '@components/tabs.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';
import { api } from '@services';
import { eventManager } from '@globals/injector';

type RouteParams = {
    UserInfo: {
        publicKey: string;
        username: string;
    };
};

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'UserInfo'>;
}

interface State {
    introduction: boolean;
    isLoading: boolean;
    selectedTab: string;
    refreshing: boolean;
    issuedNumber: number;
    receivedNumber: number;
    issued: Badge[];
    received: Badge[];
    currBadgeList: Badge[];
    currBadgeListHeader: string;
    pending: string[];
    pages: string[];
}

export class BadgesScreen extends React.Component<Props, State> {

    private _isMounted = false;

    private _refreshColor = settingsGlobals.darkMode ? 'white' : 'gray';

    private _subscriptions: (() => void)[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            introduction: false,
            isLoading: true,
            selectedTab: 'received',
            currBadgeList: [],
            currBadgeListHeader: 'No Badges Received',
            refreshing: false,
            issuedNumber: 0,
            receivedNumber: 0,
            issued: [],
            received: [],
            pending: [],
            pages: []
        };

        this._subscriptions.push(
            eventManager.addEventListener(EventType.RemovePendingBadges, this.updatePendingBadges.bind(this))
        );

        this.loadData = this.loadData.bind(this);
        this.onTabClick = this.onTabClick.bind(this);
        this.goToIssuePage = this.goToIssuePage.bind(this);
        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private updatePendingBadges(badges: string[]): void {
        if (this._isMounted) {
            const currPending = this.state.pending;
            const newPending: string[] = [];
            for (const badgeId of currPending) {
                if (!badges.includes(badgeId)) {
                    newPending.push(badgeId);
                }
            }
            this.setState({ pending: newPending });
        }
    }

    private goToIssuePage() {
        const username: string =
            this.props.route.params.username === globals.user.username
                ? ''
                : this.props.route.params.username;
        this.props.navigation.push('Issue', {
            currRecipient: username,
        });
    }

    private async loadData() {
        if (this._isMounted) {
            this.setState({ introduction: false });
        }

        if (!this.props.route.params) {
            return;
        }
        try {
            if (this._isMounted) {
                this.setState({ isLoading: true, pages: [] });
            }

            const userResponse = await bitBadgesApi.getUser(this.props.route.params.publicKey);

            const userDetails: BitBadgesUserDetails = userResponse;

            userDetails.badgesIssued.reverse();
            userDetails.badgesListed.reverse();
            userDetails.badgesAccepted.reverse();
            userDetails.badgesPending.reverse();

            if (this._isMounted) {
                this.setState({ pending: userDetails.badgesPending });
            }

            const badgeRequests = [
                bitBadgesApi.getBadges(userDetails.badgesAccepted),
                bitBadgesApi.getBadges(userDetails.badgesIssued),
            ];
            const badgeResponses = await Promise.all(badgeRequests);

            const received: Badge[] = badgeResponses[0].badges;
            const issued: Badge[] = badgeResponses[1].badges;
            received.sort((a: Badge, b: Badge) => b.dateCreated - a.dateCreated);
            issued.sort((a: Badge, b: Badge) => b.dateCreated - a.dateCreated);

            let allProfileKeys: string[] = [];
            for (const badge of issued) {
                allProfileKeys.push(badge.issuer);
                for (const recipient of badge.recipients) {
                    allProfileKeys.push(recipient);
                }
            }

            for (const badge of received) {
                allProfileKeys.push(badge.issuer);
                for (const recipient of badge.recipients) {
                    allProfileKeys.push(recipient);
                }
            }

            allProfileKeys = [...new Set(allProfileKeys)];

            const response: any = await api.getProfile(allProfileKeys);

            const profiles: Profile[] = [];
            for (const profileEntry of response.UserList) {
                profiles.push(profileEntry.ProfileEntryResponse);
            }

            for (const badge of issued) {
                const issuerProfile = profiles.find(elem => elem.PublicKeyBase58Check === badge.issuer)?.Username;
                if (issuerProfile) {
                    badge.issuerUsername = issuerProfile;
                } else {
                    badge.issuerUsername = 'Anonymous';
                }

                const recipienstUsernames: string[] = [];
                for (const recipient of badge.recipients) {
                    const recipientProfile = profiles.find(elem => elem.PublicKeyBase58Check === recipient)?.Username;
                    if (recipientProfile) {
                        recipienstUsernames.push(recipientProfile);
                    }
                }
                badge.recipientsUsernames = recipienstUsernames;
            }

            for (const badge of received) {
                const issuerProfile = profiles.find(elem => elem.PublicKeyBase58Check === badge.issuer)?.Username;
                if (issuerProfile) {
                    badge.issuerUsername = issuerProfile;
                } else {
                    badge.issuerUsername = 'Anonymous';
                }

                const recipienstUsernames: string[] = [];
                for (const recipient of badge.recipients) {
                    const recipientProfile = profiles.find(elem => elem.PublicKeyBase58Check === recipient)?.Username;
                    if (recipientProfile) {
                        recipienstUsernames.push(recipientProfile);
                    }
                }
                badge.recipientsUsernames = recipienstUsernames;
            }

            if (this._isMounted) {
                this.setState({
                    issued,
                    received,
                    currBadgeList: received,
                    currBadgeListHeader: 'No Badges Received',
                    selectedTab: 'received',
                    isLoading: false,
                    refreshing: false,
                });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async init() {
        try {
            const key =
                globals.user.publicKey +
                '_' +
                constants.localStorage_bitBadgesIntroduction;

            const bitBadgesIntroduction = await SecureStore.getItemAsync(key);

            if (bitBadgesIntroduction) {
                this.loadData();
            }
            else {
                if (this._isMounted) {
                    this.setState({ introduction: true });
                }
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private onTabClick(p_tabName: string) {
        if (this._isMounted) {
            if (
                p_tabName === 'Received Badges' &&
                this.state.selectedTab === 'issued'
            ) {
                this.setState({
                    selectedTab: 'received',
                    currBadgeList: this.state.received,
                    currBadgeListHeader: 'No Badges Received',
                });
            } else if (
                p_tabName === 'Issued Badges' &&
                this.state.selectedTab === 'received'
            ) {
                this.setState({
                    selectedTab: 'issued',
                    currBadgeList: this.state.issued,
                    currBadgeListHeader: 'No Badges Issued',
                });
            }
        }
    }

    private goToBitBadgesWebsite() {
        Linking.openURL('https://bitbadges.web.app');
    }

    render() {
        if (this.state.introduction) {
            return <BitBadgesIntroductionComponent
                close={this.loadData.bind(this)}
            />;
        }

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <View
                style={[
                    styles.headerContainer,
                    themeStyles.containerColorSub,
                    themeStyles.borderColor,
                ]}
            >
                <TouchableOpacity
                    onPress={this.goToBitBadgesWebsite.bind(this)}
                >
                    <View style={styles.poweredByContainer}>
                        <Image
                            style={styles.logoContainer}
                            source={{
                                uri: 'https://bitbadges.web.app/img/icons/logo.png',
                            }}
                        />

                        <Text style={[styles.link, themeStyles.linkColor]}>
                            Powered by BitBadges
                        </Text>
                    </View>
                </TouchableOpacity>

                {
                    !globals.readonly &&
                    <CloutFeedButton styles={[styles.headerButton]} title={'Issue a Badge'} onPress={this.goToIssuePage.bind(this)} />
                }
            </View>

            <PendingBar
                navigation={this.props.navigation}
                username={this.props.route.params.username}
                pending={this.state.pending}
            />

            <View
                style={[
                    styles.tabsContainer,
                    themeStyles.containerColorMain,
                    themeStyles.borderColor,
                ]}
            >
                <TabsComponent
                    tabs={[{ name: 'Received Badges' }, { name: 'Issued Badges' }]}
                    selectedTab={
                        this.state.selectedTab === 'received'
                            ? 'Received Badges'
                            : 'Issued Badges'
                    }
                    onTabClick={this.onTabClick.bind(this)}
                    centerText={true}
                />
            </View>

            {
                this.state.currBadgeList.length > 0 ?
                    <FlatList
                        data={this.state.currBadgeList}
                        renderItem={({ item }) => (
                            <BitBadgesListCardComponent
                                navigation={this.props.navigation}
                                badge={item}
                                key={item.id}
                                isPending={false}
                            />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.loadData.bind(this)}
                                tintColor={this._refreshColor}
                                colors={[this._refreshColor]}
                            />
                        }
                    />
                    : <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.loadData.bind(this)}
                                tintColor={this._refreshColor}
                                colors={[this._refreshColor]}
                            />
                        }
                    >
                        <BadgeListHeader
                            title={this.state.currBadgeListHeader}
                            isSubColor={true}
                        />
                    </ScrollView>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        tabsContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
        },
        headerButton: {
            marginRight: 10,
            marginBottom: 0,
            width: 120
        },
        link: {
            fontSize: 14,
            paddingVertical: 6,
            fontWeight: '500',
        },
        logoContainer: {
            width: 20,
            height: 20,
            marginVertical: 6,
            marginRight: 2,
        },
        poweredByContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            margin: 6,
            padding: 2,
        },
    }
);
