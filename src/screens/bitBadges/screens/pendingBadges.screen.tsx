import React from 'react';
import { RefreshControl, View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Badge, BitBadgesUserDetails, Profile } from '@types';
import { themeStyles } from '@styles';
import { ParamListBase } from '@react-navigation/native';
import { globals } from '@globals/globals';
import { bitBadgesApi } from '@services/api/bitBadgesApi';
import { BadgeListHeader } from '../components/badgeListHeader.component';
import { settingsGlobals } from '@globals/settingsGlobals';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { api } from '@services';
import { BitBadgesListCardComponent } from '../components/bitBadgesListCard.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
}

interface State {
    isLoading: boolean;
    pending: Badge[];
    sortedByCoinPrice: Badge[];
    pendingIds: string[];
    isRefreshing: boolean;
    sortedByTime: boolean;
}

export class PendingScreen extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            isLoading: true,
            pending: [],
            pendingIds: [],
            sortedByCoinPrice: [],
            sortedByTime: true,
            isRefreshing: false,
        };

        this.getPendingBadges = this.getPendingBadges.bind(this);
        this.getPendingIds = this.getPendingIds.bind(this);
        this.loadData = this.loadData.bind(this);
        this.sortByCoinPrice = this.sortByCoinPrice.bind(this);
        this.toggleSortedByTime = this.toggleSortedByTime.bind(this);

        this.loadData();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async loadData() {
        if (this._isMounted) {
            this.setState({ isRefreshing: true, isLoading: true });
        }

        await this.getPendingIds();
        await this.getPendingBadges();
        await this.getProfiles();
        await this.sortByCoinPrice();

        if (this._isMounted) {
            this.setState({ isRefreshing: false, isLoading: false });
        }
    }

    private async getProfiles() {
        try {
            let allProfileKeys: string[] = [];

            for (const badge of this.state.pending) {
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

            const pending = this.state.pending;

            for (const badge of pending) {
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
                this.setState({ pending });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false });
            }
        }
    }

    private async getPendingIds() {
        try {
            const publicKey = globals.user.publicKey;
            const userDetails: BitBadgesUserDetails = await bitBadgesApi.getUser(publicKey);

            if (this._isMounted) {
                this.setState({ pendingIds: userDetails.badgesPending });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private async sortByCoinPrice() {
        const coinPriceMap = new Map<string, number>();
        try {
            for (const currBadge of this.state.pending) {
                const currBadgeId = currBadge.id;
                const currBadgeIssuer = currBadge.issuer;

                const profile = await api.getSingleProfile('', currBadgeIssuer);
                coinPriceMap.set(
                    currBadgeId,
                    profile.Profile.CoinEntry.BitCloutLockedNanos
                );
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }

        const sortedPending: Badge[] = this.state.pending;

        sortedPending.sort((a: Badge, b: Badge) => {
            const aPrice = coinPriceMap.get(a.id);
            const bPrice = coinPriceMap.get(b.id);

            if (aPrice && bPrice) {
                return bPrice - aPrice;
            }
            else {
                return 0;
            }
        });

        if (this._isMounted) {
            this.setState({ sortedByCoinPrice: sortedPending });
        }
    }

    private async getPendingBadges() {
        if (this._isMounted) {
            this.setState({ isLoading: true });
        }

        try {
            const responses = await bitBadgesApi.getBadges(this.state.pendingIds);

            const pending: Badge[] = responses.badges;
            pending.sort((a: Badge, b: Badge) => b.dateCreated - a.dateCreated);

            if (this._isMounted) {
                this.setState({ pending });
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private toggleSortedByTime() {
        if (this._isMounted) {
            this.setState({ sortedByTime: !this.state.sortedByTime });
        }
    }

    render() {
        if (this.state.isLoading || this.state.isRefreshing) {
            return <CloutFeedLoader />;
        }

        return <View style={[themeStyles.containerColorMain, styles.mainContainer]}>
            <View
                style={[
                    styles.headerContainer,
                    themeStyles.containerColorSub,
                    themeStyles.borderColor,
                ]}
            >
                <Text style={[themeStyles.fontColorMain]}>
                    Sorted By: {this.state.sortedByTime ? 'Most Recent' : 'Coin Price'}
                </Text>
                <CloutFeedButton
                    styles={styles.headerButton}
                    title={`Sort By ${!this.state.sortedByTime ? 'Most Recent' : 'Coin Price'}`}
                    onPress={this.toggleSortedByTime.bind(this)}
                />
            </View>

            {
                this.state.pending.length > 0 ?
                    <FlatList
                        data={
                            this.state.sortedByTime
                                ? this.state.pending
                                : this.state.sortedByCoinPrice
                        }
                        renderItem={({ item }) => (
                            <BitBadgesListCardComponent
                                navigation={this.props.navigation}
                                badge={item}
                                key={item.id}
                                isPending={true}
                            />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.isRefreshing}
                                onRefresh={this.loadData.bind(this)}
                                tintColor={settingsGlobals.darkMode ? 'white' : 'gray'}
                                colors={[settingsGlobals.darkMode ? 'white' : 'gray']}
                            />
                        }
                    />
                    : <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.isRefreshing}
                                onRefresh={this.loadData.bind(this)}
                                tintColor={settingsGlobals.darkMode ? 'white' : 'gray'}
                                colors={[settingsGlobals.darkMode ? 'white' : 'gray']}
                            />
                        }
                    >
                        <BadgeListHeader isSubColor={true} title={'No Badges Pending'} />
                    </ScrollView>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        mainContainer: {
            height: '100%',
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            paddingLeft: 10,
            width: '100%',
            minHeight: 50,
        },
        headerButton: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 6,
            borderRadius: 4,
            marginBottom: 0,
            backgroundColor: 'black',
        },
    }
);
