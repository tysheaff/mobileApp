import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { themeStyles } from '@styles';
import ColorPicker from 'react-native-wheel-color-picker';

interface Props {
    setPicker: (picker: ColorPicker) => void;
    setBackgroundColor: (color: string) => void;
    backgroundColor: string;
    picker: ColorPicker | null;
}

export class ColorInput extends React.Component<Props> {

    constructor(props: Props) {
        super(props);

        this.onColorChange = this.onColorChange.bind(this);
    }

    private onColorChange(hexColorString: string) {
        if (this.props.picker) {
            this.props.setBackgroundColor(hexColorString);
        }
    }

    render() {
        return <View style={[styles.colorContainer, themeStyles.containerColorSub]}>
            <Text style={themeStyles.fontColorSub}>Background Color</Text>
            <ColorPicker
                ref={this.props.setPicker}
                color={'#000000'}
                onColorChangeComplete={this.onColorChange.bind(this)}
                onColorChange={this.onColorChange.bind(this)}
                thumbSize={40}
                sliderSize={40}
                noSnap={true}
                row={false}
                discrete={false}
                swatches={true}
                swatchesLast={true}
                swatchesOnly={false}
                shadeWheelThumb={true}
                shadeSliderThumb={true}
                autoResetSlider={false}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        colorContainer: {
            width: '83%',
            marginTop: 10,
            borderColor: 'gray',
            borderWidth: 3,
            padding: 10,
            borderRadius: 5,
        },
    }
);
