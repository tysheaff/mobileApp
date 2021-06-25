import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CreatorsSearchScreen } from '@screens/search/CreatorsSearch.screen';
import { StyleSheet } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import CloutTagSearchScreen from '@screens/search/cloutTagSearch.screen';
import { NavigationProp } from '@react-navigation/native';
import TopTabBarComponent from '@components/TopTabBar.component';
import { eventManager } from '@globals/injector';
import { EventType, SwitchSearchTabsEvent } from "@types";

interface Props {
    navigation: NavigationProp<any>;
}

const TopTab = createMaterialTopTabNavigator();

export default class SearchTabNavigator extends React.Component<Props> {

    private _isMounted = false;
    private _selectedTab = {};
    private _unsubscribeNavigationEvent: any;

    constructor(props: Props) {
        super(props);

        this.subscribeNavigationEvent();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this._unsubscribeNavigationEvent();
    }

    subscribeNavigationEvent() {
        this._unsubscribeNavigationEvent = eventManager.addEventListener(
            EventType.SwitchSearchTab,
            (p_event: SwitchSearchTabsEvent) => {
                if (this._isMounted) {
                    this._selectedTab = p_event;
                }
            }
        );
    }

    render() {
        return (
            <TopTab.Navigator
                tabBar={props => <TopTabBarComponent {...props} />}
                tabBarOptions={{
                    style: themeStyles.containerColorMain,
                    indicatorStyle: { backgroundColor: themeStyles.fontColorMain.color },
                    activeTintColor: themeStyles.fontColorMain.color,
                    labelStyle: styles.label,
                }}
            >
                <TopTab.Screen name="Creators" children={props => <CreatorsSearchScreen selectedTab={this._selectedTab} {...props} />} />
                <TopTab.Screen name="CloutTags" children={props => <CloutTagSearchScreen selectedTab={this._selectedTab} {...props} />} />
            </TopTab.Navigator>
        )
    }
}
const styles = StyleSheet.create({
    barContainer: {
        textTransform: 'lowercase'
    },
    label: {
        textTransform: 'none'
    }
})