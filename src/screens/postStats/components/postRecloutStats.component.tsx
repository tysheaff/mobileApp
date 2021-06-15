import { View, ActivityIndicator, FlatList } from 'react-native';
import React from "react";
import { Profile, User } from "@types";
import { api } from "@services/api";
import { globals } from "@globals/globals";
import { cache } from '@services/dataCaching';
import { ProfileListCardComponent } from '@components/profileListCard.component';
import { themeStyles } from '@styles/globalColors';

interface Props {
    postHashHex: string;
}

interface State {
    isLoading: boolean;
    profiles: Profile[];
    isLoadingMore: boolean;
}

export class PostRecloutStatsComponent extends React.Component<Props, State> {

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
            await this.loadReclouters(false);
        } catch {

        }
    }

    setFollowedByUserMap(p_user: User) {
        let followedByUserMap: any = {};

        const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser as string[];

        if (followedByUserPublicKeys?.length > 0) {
            for (let i = 0; i < followedByUserPublicKeys.length; i++) {
                followedByUserMap[followedByUserPublicKeys[i]] = true;
            }
        }

        this._followedByUserMap = followedByUserMap;
    }

    async loadReclouters(p_loadMore: boolean) {
        try {
            if (this.state.isLoadingMore || this._noMoreData) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
            }

            const response = await api.getRecloutersForPost(globals.user.publicKey, this.props.postHashHex, 50, this.state.profiles.length);
            const profiles: Profile[] = response.Reclouters;

            let newProfiles = this.state.profiles;
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

        } catch {
        }
    }

    render() {
        if (this.state.isLoading) {
            return <View style={{ height: 200, justifyContent: 'center' }}>
                <ActivityIndicator style={{ alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
            </View>;
        }

        const keyExtractor = (item: Profile, index: number) => item.PublicKeyBase58Check + index;
        const renderItem = ({ item }: { item: Profile }) => <ProfileListCardComponent profile={item} isFollowing={!!this._followedByUserMap[item.PublicKeyBase58Check]}></ProfileListCardComponent>;

        return <FlatList
            data={this.state.profiles}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={() => this.loadReclouters(true)}
            onEndReachedThreshold={3}
            maxToRenderPerBatch={20}
            windowSize={20}
            ListFooterComponent={this.state.isLoadingMore && !this.state.isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined}
        />;
    }
}