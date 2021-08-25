import { eventManager } from '@globals/injector';
import React from 'react';
import SearchTabNavigator from './searchTabNavigator';
import { EventType, FocusSearchHeaderEvent } from '@types';
import DiscoveryListComponent from './components/discoveryList.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<any>;
    route: StackNavigationProp<any>;
}

interface State {
    showSearchTabNavigator: boolean;
}

export default class SearchScreen extends React.Component<Props, State> {

    private _searchHeaderSubscription: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            showSearchTabNavigator: false
        };

        this._searchHeaderSubscription = eventManager.addEventListener(
            EventType.FocusSearchHeader,
            (event: FocusSearchHeaderEvent) => this.setState({ showSearchTabNavigator: event.focused })
        );
    }

    componentWillUnmount() {
        this._searchHeaderSubscription();
    }

    render() {
        if (this.state.showSearchTabNavigator) {
            return <SearchTabNavigator navigation={this.props.navigation}></SearchTabNavigator>;
        } else {
            return <DiscoveryListComponent navigation={this.props.navigation} route={this.props.route}></DiscoveryListComponent>;
        }
    }
}
