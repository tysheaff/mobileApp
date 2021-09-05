import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import AuctionStatusScreen from './auctionStatus.screen';
import { Post } from '@types';
import { View } from 'react-native';

type RouteParams = {
    auctions: {
        post: Post;
        postHasHex: string;
    },
};

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'auctions'>;
}

const AuctionTab = createMaterialTopTabNavigator();

export default class AuctionsTabNavigator extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render(): JSX.Element {
        return <View style={{ flex: 1 }}>
            <AuctionTab.Navigator
                tabBarOptions={
                    {
                        style:
                            [
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
                    }
                }
            >
                <AuctionTab.Screen name="On Sale" children=
                    {
                        props => <AuctionStatusScreen
                            {...props}
                            post={this.props.route.params.post}
                            selectedTab={'onSale'}
                        />
                    }
                />

                <AuctionTab.Screen name="Closed" children=
                    {
                        props => <AuctionStatusScreen
                            {...props}
                            post={this.props.route.params.post}
                            selectedTab={'closed'}
                        />
                    }
                />
            </AuctionTab.Navigator>
        </View>;
    }
}
