import React from 'react';
import { FlatList, Alert, ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import BlockedUserComponent from './blockedUserComponent.component';
import { Profile } from '@types';
import { cache } from '@services/dataCaching';
import { api, snackbar } from '@services';
import { ParamListBase } from '@react-navigation/native';
import { signing } from '@services/authorization/signing';
import { globals } from '@globals/globals';
import { themeStyles } from '@styles/globalColors';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
}

interface State {
    blockedProfiles: Profile[];
    blockedPublicKeys: string[];
    isLoading: boolean;
    isLoadingMore: boolean;
}

export default class BlockedUsersListComponent extends React.Component<Props, State> {

    private _isMounted = false;

    private _noMoreUsers = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            blockedProfiles: [],
            blockedPublicKeys: [],
            isLoading: true,
            isLoadingMore: false,
        };

        this.loadData = this.loadData.bind(this);
        this.unblockUser = this.unblockUser.bind(this);

        this.loadData(false);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.cleanCache();
    }

    cleanCache() {
        cache.user.getData(true);
    }

    async loadData(p_loadMore: boolean) {

        if (this.state.isLoadingMore || this._noMoreUsers) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        const batchSize = 10;
        const user = await cache.user.getData();
        const blockedPublicKeys = user?.BlockedPubKeys ? Object.keys(user.BlockedPubKeys) : [];
        const profileLength = this.state.blockedProfiles.length;
        const slicedBlockedPublicKeys = blockedPublicKeys.slice(profileLength, profileLength + batchSize);

        let profiles: Profile[] = [];
        const promises: Promise<Profile>[] = [];

        for (const profile of slicedBlockedPublicKeys) {
            const promise = new Promise<Profile | any>(
                async (p_resolve, _reject) => {
                    try {
                        const response = await api.getSingleProfile('', profile);
                        response.Profile.ProfilePic = api.getSingleProfileImage(profile);
                        p_resolve(response.Profile);

                    } catch {
                        p_resolve(undefined);
                    }
                }
            );
            promises.push(promise);
        }

        if (slicedBlockedPublicKeys.length < batchSize) {
            this._noMoreUsers = true;
        }

        profiles = await Promise.all(promises);
        if (p_loadMore) {
            profiles = this.state.blockedProfiles.concat(profiles);
        }

        if (this._isMounted) {
            this.setState({ blockedProfiles: profiles, isLoading: false, isLoadingMore: false });
        }
    }

    async unblockUser(publicKey: string) {
        const jwt = await signing.signJWT();
        try {
            await api.blockUser(globals.user.publicKey, publicKey, jwt, true);
        }
        catch {
            Alert.alert('Error', 'Something went wrong! Please try again.');
        } finally {
            const filteredUsers: Profile[] = this.state.blockedProfiles.filter(
                p_profile => p_profile.PublicKeyBase58Check !== publicKey
            );
            if (this._isMounted) {
                this.setState({ blockedProfiles: filteredUsers });
                snackbar.showSnackBar({ text: 'User has been unblocked' });
            }
        }
    }

    render() {

        const keyExtractor = (p_item: Profile, p_index: number) => `${p_item.PublicKeyBase58Check}_${p_index}`;

        const renderItem = (p_item: Profile) =>
            <BlockedUserComponent
                unblockUser={this.unblockUser}
                navigation={this.props.navigation}
                profile={p_item}
            />;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        return (
            this.state.isLoading
                ? <CloutFeedLoader />
                : this.state.blockedProfiles.length === 0
                    ? <View style={[styles.emptyTextContainer, themeStyles.containerColorMain]}>
                        <Text style={[themeStyles.fontColorMain, styles.emptyText]}>Your block list is empty</Text>
                    </View>
                    : <FlatList
                        data={this.state.blockedProfiles}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={keyExtractor}
                        onEndReachedThreshold={0.1}
                        onEndReached={() => this.loadData(true)}
                        maxToRenderPerBatch={10}
                        windowSize={8}
                        ListFooterComponent={renderFooter}
                    />
        );
    }
}
const styles = StyleSheet.create(
    {
        emptyTextContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        emptyText: {
            fontSize: 16,
        }
    }
);
