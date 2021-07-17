import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CloutTag } from '@types';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    cloutTag: CloutTag;
    navigation: StackNavigationProp<ParamListBase>;
}

export default class CloutListCardComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.navigateToPost = this.navigateToPost.bind(this);
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
                style={[styles.container]}
                activeOpacity={0.7}
                onPress={() => this.navigateToPost()}>
                <View style={[styles.cloutTagContainer, themeStyles.lightBorderColor]}>
                    <Feather name="hash" size={22} color={themeStyles.fontColorMain.color} />
                </View>
                <View>
                    <Text style={[styles.cloutTag, themeStyles.fontColorMain]}>#{this.props.cloutTag.clouttag}</Text>
                    <Text style={[themeStyles.fontColorSub, styles.count]}>{this.props.cloutTag.count} posts</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 10
        },
        cloutTagContainer: {
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 15,
            width: 55,
            height: 55,
            borderRadius: 50,
        },
        cloutTag: {
            fontSize: 15,
            fontWeight: '700'
        },
        count: {
            fontSize: 13,
        }
    }
);
