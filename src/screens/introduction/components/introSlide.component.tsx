import React from 'react';
import { StyleSheet, View, Image, Text, Dimensions, ImageSourcePropType } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { ScrollView } from 'react-native-gesture-handler';

interface Props {
    title: string;
    imageUri: string;
    description: JSX.Element | string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

export default class introSlideComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return <View style={[styles.container]}>
            <Image style={styles.image} source={(this.props.imageUri as ImageSourcePropType)} />
            <Text style={[styles.title, themeStyles.fontColorMain]}>{this.props.title}</Text>
            <ScrollView
                style={styles.descriptionContainer}
                bounces={false}>
                <Text style={[styles.description, themeStyles.fontColorMain]}>{this.props.description}</Text>
            </ScrollView>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            width: screenWidth,
            alignItems: 'center',
            padding: 20
        },
        image: {
            width: 150,
            height: 150,
            marginBottom: 20
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20
        },
        description: {
            textAlign: 'center',
            fontWeight: '600',
            fontSize: 15,
            paddingBottom: 10,
        },
        descriptionContainer: {
            paddingHorizontal: 15,
            maxHeight: (screenHeight - 150) * 0.7
        }
    }
);
