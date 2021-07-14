import React from 'react';
import { StyleSheet, View, Image, Text, Dimensions, ImageSourcePropType } from 'react-native';
import { themeStyles } from '@styles/globalColors';

interface Props {
    title: string;
    imageUri: string;
    description: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

export default class introSlideComponent extends React.Component<Props> {

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
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <Image style={styles.image} source={(this.props.imageUri as ImageSourcePropType)} />
            <Text style={[styles.title, themeStyles.fontColorMain]}>{this.props.title}</Text>
            <View style={{ height: 100 }}>
                <Text style={[styles.description, themeStyles.fontColorMain]}>{this.props.description}</Text>
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            width: screenWidth,
            alignItems: 'center',
            padding: 20,
            height: screenHeight * 0.6,
            justifyContent: 'space-evenly',
        },
        image: {
            width: 200,
            height: 200,
        },
        title: {
            fontSize: 20,
            fontWeight: 'bold',
            paddingVertical: 10,
        },
        description: {
            textAlign: 'center',
            fontWeight: '600',
            fontSize: 15,
            paddingBottom: 10,
        }
    }
);
