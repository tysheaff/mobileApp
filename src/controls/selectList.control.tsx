import { themeStyles } from '@styles/globalColors';
import React from 'react';
import { View, StyleSheet, Text, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SelectListOption {
    name: string;
    value: string;
}

interface Props {
    style?: StyleProp<ViewStyle>;
    options: SelectListOption[];
    value?: string | string[];
    onValueChange?: (p_value: string | string[]) => void;
    multiple?: boolean;
}

interface State {
    value?: string | string[];
}

export class SelectListControl extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            value: this.props.value
        };
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    onOptionPress(p_value: string): void {
        let newValue: string | string[] | undefined;

        if (this.props.multiple) {
            const oldValues = this.state.value ? (this.state.value as string[]).slice(0) : [];
            const index = oldValues.indexOf(p_value);

            if (index === -1) {
                oldValues.push(p_value);
            } else {
                oldValues.splice(index, 1);
            }

            newValue = oldValues;
        } else {
            newValue = p_value;
        }

        if (this._isMounted) {
            this.setState({ value: newValue });
        }

        if (this.props.onValueChange) {
            this.props.onValueChange(newValue);
        }
    }

    getCheckIcon(p_value: string): JSX.Element | false {
        let showIcon = false;

        if (this.props.multiple) {
            showIcon = !!this.props.value && this.props.value.indexOf(p_value) !== -1;
        } else {
            showIcon = this.props.value === p_value;
        }
        return showIcon && <MaterialIcons style={styles.checkIcon} name="check-circle" size={22} color="#007ef5" />;
    }

    render(): JSX.Element {
        return <View style={this.props.style}>
            {
                this.props.options.map(
                    p_option => <TouchableOpacity activeOpacity={1} style={styles.optionContainer} key={p_option.value} onPress={() => this.onOptionPress(p_option.value)}>
                        <Text style={[themeStyles.fontColorMain, styles.optionText]}>{p_option.name}</Text>
                        {
                            this.getCheckIcon(p_option.value)
                        }
                    </TouchableOpacity>
                )
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        optionContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 15,
            paddingRight: 15,
            width: '100%',
            height: 50
        },
        optionText: {
            fontSize: 16,
            fontWeight: '400'
        },
        checkIcon: {
            marginLeft: 'auto'
        }
    }
);
