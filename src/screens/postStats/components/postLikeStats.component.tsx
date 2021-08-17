import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Text } from 'react-native';
import { Profile, User } from '@types';
import { api } from '@services';
import { globals } from '@globals/globals';
import { cache } from '@services/dataCaching';
import { ProfileListCardComponent } from '@components/profileListCard.component';
import { themeStyles } from '@styles/globalColors';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

interface Props {
    postHashHex: string;
}

interface State {
    isLoading: boolean;
    profiles: Profile[];
    isLoadingMore: boolean;
}

export class PostLikeStatsComponent extends React.Component<Props, State> {

    private _followedByUserMap: any;

    private _noMoreData = false;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            profiles: [],
            isLoadingMore: false
        };

        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async init() {
        try {
            const user = await cache.user.getData();
            this.setFollowedByUserMap(user);
            await this.loadLikers(false);
        } catch { }
    }

    setFollowedByUserMap(p_user: User) {
        const followedByUserMap: any = {};

        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser;

        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }

        this._followedByUserMap = followedByUserMap;
    }

    async loadLikers(p_loadMore: boolean) {
        try {
            if (this.state.isLoadingMore || this._noMoreData) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
            }

            const response = await api.getLikesForPost(globals.user.publicKey, this.props.postHashHex, 50, this.state.profiles.length);
            const profiles: Profile[] = response.Likers;

            const newProfiles = this.state.profiles;
            if (profiles?.length > 0) {
                for (const profile of profiles) {
                    profile.ProfilePic = api.getSingleProfileImage(profile.PublicKeyBase58Check);

                }

                newProfiles.push(...profiles);
            }

            if (profiles?.length < 50) {
                this._noMoreData = true;
            }

            if (this._isMounted) {
                this.setState({ profiles: newProfiles, isLoading: false, isLoadingMore: false });
            }

        } catch { }
    }

    render() {
        const keyExtractor = (item: Profile, index: number) => item.PublicKeyBase58Check + index;
        const renderItem = ({ item }: { item: Profile }) => <ProfileListCardComponent profile={item} isFollowing={!!this._followedByUserMap[item.PublicKeyBase58Check]} />;
        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.isLoading
                    ? <CloutFeedLoader />
                    : this.state.profiles.length === 0
                        ? <Text style={[styles.emptyText, themeStyles.fontColorSub]}>No likes for this post yet</Text>
                        : <FlatList
                            data={this.state.profiles}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            onEndReached={() => this.loadLikers(true)}
                            onEndReachedThreshold={3}
                            maxToRenderPerBatch={20}
                            windowSize={20}
                            ListFooterComponent={renderFooter}
                        />
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        emptyText: {
            fontSize: 16,
            textAlign: 'center',
            marginTop: 40,
        }
    }
);
