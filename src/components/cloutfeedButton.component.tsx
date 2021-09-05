import { settingsGlobals } from '@globals/settingsGlobals';
import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    styles?: StyleProp<ViewStyle>;
    disabled?: boolean;
    isLoading?: boolean;
    backgroundColor?: any;
}

export default class CloutFeedButton extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        this.onPress = this.onPress.bind(this);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        return this.props.disabled !== nextProps.disabled ||
            this.props.title !== nextProps.title ||
            this.props.isLoading !== nextProps.isLoading;
    }

    private onPress(): void {
        if (this.props.disabled) {
            return;
        }
        this.props.onPress();
    }

    render(): JSX.Element {

        const backgroundColor = this.props.backgroundColor ? this.props.backgroundColor : this.props.disabled ? themeStyles.buttonDisabledColor.backgroundColor : 'black';
        const borderWidth = settingsGlobals.darkMode ? 1 : 0;

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.onPress()}
                style={[
                    styles.btnContainer,
                    this.props.styles,
                    { backgroundColor },
                    { borderWidth },
                    themeStyles.buttonBorderColor
                ]}>
                {
                    this.props.isLoading ?
                        <ActivityIndicator color='white' /> :
                        <Text style={styles.btnTitle}>{this.props.title}</Text>

                }
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create(
    {
        btnContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 4,
        },
        btnTitle: {
            color: 'white'
        }
    }
);
