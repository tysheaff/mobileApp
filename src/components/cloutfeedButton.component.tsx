import { settingsGlobals } from '@globals/settingsGlobals';
import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native'

interface Props {
    title: string;
    onPress: () => void;
    styles: any;
    disabled: boolean;
}

export default class CloutfeedButtonComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        this.onPress = this.onPress.bind(this);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.disabled !== p_nextProps.disabled ||
            this.props.title !== p_nextProps.title;
    }

    onPress(){
        this.props.onPress();
    }

    render() {
        return (
            <TouchableOpacity
                disabled={this.props.disabled}
                activeOpacity={1}
                onPress={this.onPress}
                style={[
                    styles.btnContainer,
                    this.props.styles,
                    { backgroundColor: this.props.disabled ? themeStyles.buttonDisabledColor.backgroundColor : 'black' },
                    { borderWidth: settingsGlobals.darkMode ? 1 : 0 },
                    themeStyles.buttonBorderColor
                ]}>
                <Text style={styles.btnTitle}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    btnContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: 'black',
    },
    btnTitle: {
        color: 'white'
    }
})
