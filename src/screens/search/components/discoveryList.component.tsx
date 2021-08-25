import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { StyleSheet, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { FontAwesome, SimpleLineIcons, Octicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { api, cache, cloutFeedApi, getAnonymousProfile } from '@services';
import { DiscoveryType, Profile } from '@types';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { ScrollView } from 'react-native-gesture-handler';
import { ProfileListCardComponent } from '@components/profileListCard.component';

interface Props {
    navigation: StackNavigationProp<any>;
    route: StackNavigationProp<any>;
}

interface State {
    isLoading: boolean;
    refreshing: boolean;
    featuredProfiles: Profile[];
}

export default class DiscoveryListComponent extends React.Component<Props, State> {

    private _followedByUserMap: any;

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            refreshing: false,
            featuredProfiles: []
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

    shouldComponentUpdate(_prevProps: Props, prevState: State) {
        return prevState.isLoading !== this.state.isLoading;
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
                this.setState({ isLoading: false, refreshing: false });
            }
        }
    }

    private async fetchFeaturedCreators() {
        const publicKeys: string[] = await cloutFeedApi.getDiscoveryType(DiscoveryType.FeaturedCreator);

        if (publicKeys?.length > 0) {
            const requests = publicKeys?.map(publicKey => api.getSingleProfile('', publicKey).catch(() => ({ Profile: getAnonymousProfile(publicKey) })));
            const response = await Promise.all(requests);
            const featuredProfiles: Profile[] = response.map(response => response.Profile);

            if (this._isMounted) {
                this.setState({ featuredProfiles });
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

    private renderListItem(icon: any, text: string, discoveryType: DiscoveryType) {
        return <TouchableOpacity
            onPress={() => this.props.navigation.push('DiscoveryTypeCreator', { discoveryType })}
            activeOpacity={0.7}>
            <View style={[styles.listItemContainer, themeStyles.lightBorderColor]}>
                {icon}
                <Text style={[styles.listItemText, themeStyles.fontColorMain]}>{text}</Text>
            </View>
        </TouchableOpacity>;
    }

    render() {

        if (this.state.isLoading) {
            return <CloutFeedLoader></CloutFeedLoader>;
        }

        return <ScrollView
            style={[styles.container, themeStyles.containerColorMain]}
            refreshControl={
                <RefreshControl
                    refreshing={this.state.refreshing}
                    onRefresh={this.init}
                    tintColor={themeStyles.fontColorMain.color}
                    titleColor={themeStyles.fontColorMain.color}
                />
            }>
            {this.renderListItem(<Octicons name="project" size={24} color={themeStyles.fontColorMain.color} />, 'Community Projects', DiscoveryType.CommunityProject)}
            {this.renderListItem(<FontAwesome name="line-chart" size={21} color={themeStyles.fontColorMain.color} />, 'Value Creators', DiscoveryType.ValueCreator)}
            {this.renderListItem(<SimpleLineIcons name="user-female" size={24} color={themeStyles.fontColorMain.color} />, 'Goddesses', DiscoveryType.Goddess)}

            <Text style={[styles.featuredCreatorsText, themeStyles.fontColorSub]}>Featured Creators</Text>

            {
                this.state.featuredProfiles.map(
                    profile => <ProfileListCardComponent
                        key={profile.PublicKeyBase58Check}
                        profile={profile}
                        isFollowing={!!this._followedByUserMap[profile.PublicKeyBase58Check]}
                    />
                )
            }
        </ScrollView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        listItemContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 10,

            width: '100%',
            borderBottomWidth: 1
        },
        listItemText: {
            fontWeight: '600',
            marginLeft: 10,
            fontSize: 15
        },
        featuredCreatorsText: {
            marginTop: 16,
            paddingHorizontal: 10,
        }
    }
);
