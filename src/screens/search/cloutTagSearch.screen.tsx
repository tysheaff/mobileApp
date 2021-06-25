import { themeStyles } from '@styles/globalColors'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { NavigationProp } from '@react-navigation/native';
import CloutTagList from './components/cloutTagList.component'

interface Props {
    navigation: NavigationProp<any>;
    selectedTab: any;
}

export default class CloutTagSearchScreen extends React.Component<Props> {

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
            <View style={[styles.container, themeStyles.containerColorMain]}>
                <CloutTagList selectedTab={this.props.selectedTab} navigation={this.props.navigation} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})
