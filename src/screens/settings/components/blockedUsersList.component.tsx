import React from 'react'
import { FlatList, Alert, ActivityIndicator, Text, View, StyleSheet } from 'react-native'
import BlockedUserComponent from './blockedUserComponent.component'
import { Profile } from '@types'
import { cache } from '@services/dataCaching';
import { api, snackbar } from '@services';
import { NavigationProp } from "@react-navigation/native";
import { signing } from '@services/authorization/signing';
import { globals } from '@globals/globals';
import { themeStyles } from '@styles/globalColors';

interface Props {
    navigation: NavigationProp<any>;
}

interface State {
    blockedProfiles: Profile[];
    blockedPublicKeys: string[];
    isLoading: boolean;
    isLoadingMore: boolean;
}

export default class BlockedUsersListComponent extends React.Component<Props, State> {

    private _isMounted: boolean = false;
    private _noMoreUsers: boolean = false;
    private _firstProfileIndex: number = 0;
    private _lastProfileIndex: number = 10;

    constructor(props: Props) {
        super(props);

        this.state = {
            blockedProfiles: [],
            blockedPublicKeys: [],
            isLoading: true,
            isLoadingMore: false,
        };

        this.init = this.init.bind(this);
        this.unblockUser = this.unblockUser.bind(this);

        this.init(false);
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

    async init(p_loadMore: boolean) {

        if (this.state.isLoadingMore || this._noMoreUsers) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
        }

        const user = await cache.user.getData();
        const blockedPublicKeys = user?.BlockedPubKeys ? Object.keys(user.BlockedPubKeys) : [];
        const slicedBlockedPublicKeys = blockedPublicKeys.slice(this._firstProfileIndex, this._lastProfileIndex);
        let profiles: Profile[] = [];
        const promises: Promise<Profile>[] = [];
        for (const profile of slicedBlockedPublicKeys) {
            const promise = new Promise<Profile | any>(
                async (p_resolve, _reject) => {
                    try {
                        const response = await api.getSingleProfile('', profile);
                        response.Profile.ProfilePic = api.getSingleProfileImage(profile);
                        profiles.push(response.Profile);
                        p_resolve(response.Profile);

                    } catch {
                        p_resolve(undefined);
                    }
                }
            );
            promises.push(promise);
        }

        if (promises.length < 10) {
            this._noMoreUsers = true;
        }

        this._firstProfileIndex = this._lastProfileIndex;
        this._lastProfileIndex = this._firstProfileIndex + 10;
        if (p_loadMore) {
            profiles = this.state.blockedProfiles.concat(await Promise.all(promises));
        } else {
            profiles = await Promise.all(promises);
        }

        if (this._isMounted) {
            this.setState({ blockedProfiles: profiles, isLoading: false, isLoadingMore: false });
        }
    }

    async unblockUser(publicKey: string) {
        const jwt = await signing.signJWT();
        try {
            await api.blockUser(globals.user.publicKey, publicKey, jwt as string, true);
        }
        catch {
            Alert.alert('Error', 'Something went wrong! Please try again.');
        } finally {
            const filteredUsers: Profile[] = this.state.blockedProfiles.filter((p_item: Profile) =>
                p_item.PublicKeyBase58Check !== publicKey);
            if (this._isMounted) {
                this.setState({ blockedProfiles: filteredUsers });
                snackbar.showSnackBar({ text: 'User unblocked successfully.' });
            }
        }
    }

    render() {

        const keyExtractor = (p_item: Profile, p_index: number) => `${p_item}_${p_index}`;

        const renderItem = (p_item: Profile) =>
            <BlockedUserComponent
                unblockUser={this.unblockUser}
                navigation={this.props.navigation}
                profile={p_item} />;

        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        return (
            this.state.isLoading
                ? <ActivityIndicator style={{ height: 200, alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
                : this.state.blockedProfiles.length === 0
                    ? <View style={[styles.emptyTextContainer, themeStyles.containerColorMain]}>
                        <Text style={[themeStyles.fontColorMain, styles.emptyText]}>You block list is empty!</Text>
                    </View>
                    : <FlatList
                        data={this.state.blockedProfiles}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={keyExtractor}
                        onEndReachedThreshold={0.1}
                        onEndReached={() => this.init(true)}
                        maxToRenderPerBatch={10}
                        windowSize={8}
                        ListFooterComponent={renderFooter}
                    />
        )
    }
}
const styles = StyleSheet.create({
    emptyTextContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 20,
    }
})