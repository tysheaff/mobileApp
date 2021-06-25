import { themeStyles } from '@styles/globalColors';
import React from 'react'
import { View } from 'react-native'
import { NavigationProp } from "@react-navigation/native";
import BlockedUsersListComponent from './components/blockedUsersList.component';

interface Props {
    navigation: NavigationProp<any>;
}

export default class BlockedUsersScreen extends React.Component<Props> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        return (
            <View style={[{ flex: 1, }, themeStyles.containerColorMain]}>
                <BlockedUsersListComponent navigation={this.props.navigation} />
            </View>
        )
    }
}