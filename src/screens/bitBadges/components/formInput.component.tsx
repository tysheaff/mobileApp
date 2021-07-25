import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { themeStyles } from '@styles';
import { settingsGlobals } from '@globals/settingsGlobals';

interface Props {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline: boolean;
    maxLength: number;
}

export class FormInput extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return this.props.value !== p_nextProps.value;
    }

    render() {
        return <View style={styles.inputContainer}>
            <Text style={themeStyles.fontColorSub}>{this.props.label}</Text>
            <TextInput
                style={[
                    styles.textInput,
                    themeStyles.fontColorMain,
                    themeStyles.borderColor,
                ]}
                value={this.props.value}
                onChangeText={this.props.onChangeText}
                keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                multiline={this.props.multiline}
                maxLength={this.props.maxLength ? this.props.maxLength : 1048}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        inputContainer: {
            width: '83%',
            marginTop: 10,
        },
        textInput: {
            borderColor: 'gray',
            borderBottomWidth: 1,
            paddingVertical: 4,
            width: '100%',
            marginBottom: 16
        }
    }
);
