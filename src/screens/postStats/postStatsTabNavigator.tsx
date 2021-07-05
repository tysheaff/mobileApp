import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { PostLikeStatsComponent } from './components/postLikeStats.component';
import { PostRecloutStatsComponent } from './components/postRecloutStats.component';
import { PostQuoteStatsComponent } from './components/postQuoteStats.component';
import { PostDiamondStatsComponent } from './components/postDiamondStats.component';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';

type RouteParams = {
    PostStatsTabNavigator: {
        postHashHex: string;
    }
}

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'PostStatsTabNavigator'>;
}

const PostStatTab = createMaterialTopTabNavigator();

export default class postStatsTabNavigator extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <PostStatTab.Navigator
                sceneContainerStyle={themeStyles.containerColorMain}
                tabBarOptions={{
                    style: themeStyles.containerColorMain,
                    indicatorStyle: { backgroundColor: themeStyles.fontColorMain.color },
                    tabStyle: { marginTop: 0 },
                    activeTintColor: themeStyles.fontColorMain.color,
                    labelStyle: { fontWeight: 'bold', textTransform: 'none' },
                    inactiveTintColor: themeStyles.fontColorSub.color,
                }}
                initialRouteName={'Likes'}
            >
                <PostStatTab.Screen name="Likes" children={props => <PostLikeStatsComponent postHashHex={this.props.route.params.postHashHex} {...props} />} />
                <PostStatTab.Screen name="Reclouts" children={props => <PostRecloutStatsComponent postHashHex={this.props.route.params.postHashHex} {...props} />} />
                <PostStatTab.Screen name="Quotes" children={props => <PostQuoteStatsComponent postHashHex={this.props.route.params.postHashHex} {...props} />} />
                <PostStatTab.Screen name="Diamonds" children={props => <PostDiamondStatsComponent postHashHex={this.props.route.params.postHashHex}  {...props} />} />
            </PostStatTab.Navigator>
        )
    }
}