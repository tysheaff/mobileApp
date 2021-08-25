import React from 'react';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { DiscoveryType, Profile } from '@types';
import { api, cache, cloutFeedApi, getAnonymousProfile } from '@services';
import { RouteProp } from '@react-navigation/native';
import { ProfileListCardComponent } from '@components/profileListCard.component';
import { FlatList, RefreshControl } from 'react-native';
import { themeStyles } from '@styles/globalColors';

type RouteParams = {
    DiscoveryTypeCreator: {
        discoveryType: DiscoveryType;
    }
};

interface Props {
    route: RouteProp<RouteParams, 'DiscoveryTypeCreator'>;
}

interface State {
    isLoading: boolean;
    isRefreshing: boolean;
    profiles: Profile[];
}

export class DiscoveryTypeCreatorScreen extends React.Component<Props, State>{

    private _followedByUserMap: any;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            isRefreshing: false,
            profiles: []
        };

        this.init();

        this.init = this.init.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private async init() {
        try {

            if (this._isMounted) {
                this.setState({ isLoading: true });
            }

            await Promise.all(
                [
                    this.fetchFeaturedCreators(),
                    this.setFollowedByUserMap()
                ]
            );
        } catch (e) {
        } finally {
            if (this._isMounted) {
                this.setState({ isLoading: false, isRefreshing: false });
            }
        }
    }

    private async fetchFeaturedCreators() {
        const publicKeys: string[] = await cloutFeedApi.getDiscoveryType(this.props.route.params.discoveryType);
        if (publicKeys?.length > 0) {
            const requests = publicKeys?.map(publicKey => api.getSingleProfile('', publicKey).catch(() => ({ Profile: getAnonymousProfile(publicKey) })));
            const response = await Promise.all(requests);
            const profiles: Profile[] = response.map(response => response.Profile);

            if (this._isMounted) {
                this.setState({ profiles });
            }
        }
    }

    private async setFollowedByUserMap() {
        const user = await cache.user.getData();

        const followedByUserMap: any = {};

        const followedByUserPublicKeys = user.PublicKeysBase58CheckFollowedByUser;

        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }

        this._followedByUserMap = followedByUserMap;
    }

    render() {
        if (this.state.isLoading) {
            return <CloutFeedLoader></CloutFeedLoader>;
        }

        const keyExtractor = (item: Profile, index: number) => item.PublicKeyBase58Check + index;
        const renderItem = ({ item }: { item: Profile }) => <ProfileListCardComponent profile={item} isFollowing={!!this._followedByUserMap[item.PublicKeyBase58Check]} />;

        return <FlatList
            style={themeStyles.containerColorMain}
            data={this.state.profiles}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReachedThreshold={3}
            maxToRenderPerBatch={20}
            windowSize={20}
            refreshControl={
                <RefreshControl
                    refreshing={this.state.isRefreshing}
                    onRefresh={this.init}
                    tintColor={themeStyles.fontColorMain.color}
                    titleColor={themeStyles.fontColorMain.color}
                />
            }
        />;
    }
}
