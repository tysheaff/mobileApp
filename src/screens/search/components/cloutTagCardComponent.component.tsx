import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CloutTag } from '@types';
import { NavigationProp } from '@react-navigation/native';

interface Props {

    cloutTag: CloutTag;
    navigation: NavigationProp<any>;
}

export default class CloutListCardComponentComponent extends React.Component<Props> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.navigateToPost = this.navigateToPost.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.cloutTag !== p_nextProps.cloutTag;
    }

    navigateToPost() {
        this.props.navigation.navigate('CloutTagPosts', { cloutTag: this.props.cloutTag.clouttag });
    }

    render() {
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={this.navigateToPost} style={styles.rowContainer}>
                <View style={[styles.cloutTagContainer, themeStyles.borderColor]}>
                    <Feather name="hash" size={24} color={themeStyles.fontColorMain.color} />
                </View>
                <View>
                    <Text style={[styles.cloutTag, themeStyles.fontColorMain]}>#{this.props.cloutTag.clouttag}</Text>
                    <Text style={[themeStyles.fontColorSub, styles.count]}>{this.props.cloutTag.count} posts</Text>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    cloutTagContainer: {
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        width: 55,
        height: 55,
        borderRadius: 28,
    },
    cloutTag: {
        fontSize: 15,
        fontWeight: '700'
    },
    count: {
        fontSize: 13,
    }
})