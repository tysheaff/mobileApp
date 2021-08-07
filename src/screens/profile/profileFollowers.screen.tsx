import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import React from 'react';
import { StyleSheet, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Profile, User } from '@types';
import { ProfileListCardComponent } from '@components/profileListCard.component';
import { themeStyles } from '@styles/globalColors';
import { api } from '@services';
import { cache } from '@services/dataCaching';
import { getAnonymousProfile } from '@services/helpers';
import { globals } from '@globals/globals';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    username: string;
    publicKey: string;
    selectedTab: string;
}

interface State {
    isLoading: boolean;
    isLoadingMore: boolean;
    isRefreshing: boolean;
    profiles: Profile[];
    loggedInUserFollowingMap: { [key: string]: Profile };
    followersNumber: number;
}

export default class ProfileFollowers extends React.Component<Props, State> {

    private _isMounted = false;

    private _canLoadMore = true;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isLoadingMore: false,
            isRefreshing: false,
            profiles: [],
            loggedInUserFollowingMap: {},
            followersNumber: 0
        };

        this.loadFollowers = this.loadFollowers.bind(this);
        this.loadFollowers(false);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    private createProfilesArray(p_response: any): Profile[] {
        const profiles: Profile[] = [];

        if (p_response.PublicKeyToProfileEntry) {
            const publicKeys = Object.keys(p_response.PublicKeyToProfileEntry);
            for (const publicKey of publicKeys) {
                if (p_response.PublicKeyToProfileEntry[publicKey]) {
                    profiles.push(p_response.PublicKeyToProfileEntry[publicKey]);
                } else {
                    const anonymousProfile = getAnonymousProfile(publicKey);
                    profiles.push(anonymousProfile);
                }
            }
        }

        profiles.sort(
            (p_profile1, p_profile2) => p_profile2.CoinEntry.BitCloutLockedNanos - p_profile1.CoinEntry.BitCloutLockedNanos
        );
        return profiles;
    }

    private setFollowedByUserMap(user: User): void {
        const followedByUserMap: any = {};

        const followedByUserPublicKeys = user.PublicKeysBase58CheckFollowedByUser;

        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }
        if (this._isMounted) {
            this.setState({ loggedInUserFollowingMap: followedByUserMap });
        }
    }

    private async loadFollowers(loadMore: boolean): Promise<void> {
        if (this.state.isLoadingMore || !this._canLoadMore) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !loadMore, isLoadingMore: loadMore });
        }

        const targetApi = this.props.selectedTab === 'followers' ? api.getProfileFollowers : api.getProfileFollowing;
        const requests = [
            targetApi('', this.props.username, '', 50),
            cache.user.getData()
        ];
        try {
            if (loadMore) {
                const lastPublicKeyBase58Check = this.state.profiles[this.state.profiles.length - 1].PublicKeyBase58Check;

                const newResponse = await targetApi('', this.props.username, lastPublicKeyBase58Check, 50);
                const newValues = this.createProfilesArray(newResponse);
                if (newValues?.length > 0) {
                    const newTargetArray = this.state.profiles.concat(newValues).slice(0, this.state.followersNumber);

                    if (this._isMounted) {
                        this.setState({ profiles: newTargetArray });
                    }
                }
            } else {
                const responses = await Promise.all(requests);
                const followers = this.createProfilesArray(responses[0]);

                if (this._isMounted) {
                    this.setState(
                        {
                            profiles: followers,
                            followersNumber: responses[0].NumFollowers
                        }
                    );
                    this.setFollowedByUserMap(responses[1]);
                }
            }
            this._canLoadMore = this.state.profiles?.length > 0 && this.state.followersNumber > this.state.profiles.length;
        }
        catch (error) {
            globals.defaultHandleError(error);
        } finally {
            if (this._isMounted) {
                this.setState(
                    {
                        isLoading: false,
                        isRefreshing: false,
                        isLoadingMore: false,
                    }
                );
            }
        }
    }

    render(): JSX.Element {

        const keyExtractor = (item: Profile, index: number) => `${item.PublicKeyBase58Check}_${index.toString()}`;

        const renderItem = (item: Profile): JSX.Element => <ProfileListCardComponent
            profile={item}
            isFollowing={!!this.state.loggedInUserFollowingMap[item.PublicKeyBase58Check]}
        />;

        const refreshControl = <RefreshControl
            tintColor={themeStyles.fontColorMain.color}
            titleColor={themeStyles.fontColorMain.color}
            refreshing={this.state.isRefreshing}
            onRefresh={
                () => {
                    this._canLoadMore = true;
                    this.loadFollowers(false);
                }
            }
        />;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading ?
            <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        if (this.state.isLoading) {
            return <CloutFeedLoader />;
        }

        return this.state.profiles.length === 0 ?
            <Text style={[themeStyles.fontColorSub, styles.emptyFollowers]}>
                {
                    this.props.selectedTab === 'followers ' ?
                        `${this.props.username} has no followers yet!` :
                        `${this.props.username} is not following anyone yet!`
                }
            </Text>

            : <FlatList
                data={this.state.profiles}
                keyExtractor={keyExtractor}
                renderItem={({ item }) => renderItem(item)}
                refreshControl={refreshControl}
                showsHorizontalScrollIndicator={false}
                onEndReached={() => this.loadFollowers(true)}
                onEndReachedThreshold={3}
                maxToRenderPerBatch={20}
                windowSize={20}
                ListFooterComponent={renderFooter}
                style={styles.flatList}
            />;
    }
}

const styles = StyleSheet.create(
    {
        flatList: {
            flex: 1,
        },
        emptyFollowers: {
            fontSize: 17,
            paddingTop: 40,
            textAlign: 'center'
        }
    }
);
