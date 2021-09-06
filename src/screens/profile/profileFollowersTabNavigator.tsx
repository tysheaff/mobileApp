import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { StackNavigationProp } from '@react-navigation/stack';
import ProfileFollowers from './profileFollowers.screen';
import { formatNumber } from '@services/helpers';

type RouteParams = {
    Followers: {
        username: string;
        publicKey: string;
        selectedTab: string;
        followersNumber: number | undefined;
        followingNumber: number | undefined;
    }
};

interface Props {
    route: RouteProp<RouteParams, 'Followers'>;
    navigation: StackNavigationProp<ParamListBase>;
}

const TopTab = createMaterialTopTabNavigator();

export default class ProfileFollowersTab extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render(): JSX.Element {
        return <TopTab.Navigator
            initialRouteName={this.props.route.params.selectedTab}
            tabBarOptions={{
                style: [
                    themeStyles.containerColorMain,
                    {
                        elevation: 0,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0,
                        shadowRadius: 0
                    }
                ],
                indicatorStyle: { backgroundColor: themeStyles.fontColorMain.color },
                tabStyle: { marginTop: 0 },
                activeTintColor: themeStyles.fontColorMain.color,
                labelStyle: { fontWeight: 'bold', textTransform: 'none' },
                inactiveTintColor: themeStyles.fontColorSub.color,
            }}
            sceneContainerStyle={themeStyles.containerColorMain} >
            <TopTab.Screen
                options={
                    {
                        title: 'Followers',
                        tabBarLabel: `${this.props.route.params?.followersNumber ?
                            formatNumber(this.props.route.params?.followersNumber, false) : 0} Followers`
                    }
                }
                name="Followers"
                children={
                    () => <ProfileFollowers
                        selectedTab={'followers'}
                        navigation={this.props.navigation}
                        publicKey={this.props.route.params.publicKey}
                        username={this.props.route.params.username}
                    />
                }
            />

            <TopTab.Screen
                options={
                    {
                        tabBarLabel: `${this.props.route.params?.followingNumber ?
                            formatNumber(this.props.route.params?.followingNumber, false) : 0} Following`
                    }
                }
                name="Following" children={
                    () => <ProfileFollowers
                        selectedTab={'following'}
                        navigation={this.props.navigation}
                        publicKey={this.props.route.params.publicKey}
                        username={this.props.route.params.username}
                    />
                } />
        </TopTab.Navigator>;
    }
}
