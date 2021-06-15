import React from "react";
import { View } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { themeStyles } from "@styles";
import { TabConfig, TabsComponent } from "@components/tabs.component";
import { PostLikeStatsComponent } from "./components/postLikeStats.component";
import { PostRecloutStatsComponent } from "./components/postRecloutStats.component";
import { PostDiamondStatsComponent } from "./components/postDiamondStats.component";
import { PostQuoteStatsComponent } from "./components/postQuoteStats.component";

enum SelectedTab {
    Likes = 'Likes',
    Reclouts = 'Reclouts',
    Quotes = 'Quotes',
    Diamonds = 'Diamonds'
}

type RouteParams = {
    PostStats: {
        postHashHex: string;
        selectedTab: SelectedTab;
    }
}

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<RouteParams, 'PostStats'>;
}

interface State {
    selectedTab: SelectedTab;
}

export class PostStatsScreen extends React.Component<Props, State> {

    private readonly _tabs: TabConfig[] = [
        {
            name: SelectedTab.Likes
        },
        {
            name: SelectedTab.Reclouts
        },
        {
            name: SelectedTab.Quotes
        },
        {
            name: SelectedTab.Diamonds
        }
    ];

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedTab: this.props.route.params.selectedTab ? this.props.route.params.selectedTab : SelectedTab.Likes
        }

        this.onTabClick = this.onTabClick.bind(this);
    }

    onTabClick(p_tabName: string) {
        this.setState({ selectedTab: p_tabName as SelectedTab });
    }

    render() {
        const renderTab = () => {
            const postHashHex = this.props.route.params.postHashHex;
            switch (this.state.selectedTab) {
                case SelectedTab.Likes:
                    return <PostLikeStatsComponent postHashHex={postHashHex} />;
                case SelectedTab.Reclouts:
                    return <PostRecloutStatsComponent postHashHex={postHashHex} />;
                case SelectedTab.Quotes:
                    return <PostQuoteStatsComponent navigation={this.props.navigation} route={this.props.route} postHashHex={postHashHex} />;
                case SelectedTab.Diamonds:
                    return <PostDiamondStatsComponent navigation={this.props.navigation} postHashHex={postHashHex} />;
            }
        };

        return <View style={[{ flex: 1 }, themeStyles.containerColorMain]}>
            <TabsComponent
                tabs={this._tabs}
                selectedTab={this.state.selectedTab}
                onTabClick={this.onTabClick}
                centerText={true}
            ></TabsComponent>
            {
                renderTab()
            }
        </View>;
    }
}