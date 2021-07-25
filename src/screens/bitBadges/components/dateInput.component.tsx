import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { themeStyles } from '@styles';
import DateTimePicker, { Event } from '@react-native-community/datetimepicker';
import CloutFeedButton from '@components/cloutfeedButton.component';

interface Props {
    validDates: boolean;
    date: Date;
    setDate: (date: Date) => void;
    label: string;
}

interface State {
    showDateModalAndroid: boolean;
}

export class DateInput extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            showDateModalAndroid: false,
        };

        this.showModal = this.showModal.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private onDateChange(event: Event, selectedDate: Date | undefined) {
        if (this._isMounted) {
            this.setState({ showDateModalAndroid: false });
            const currentDate = selectedDate || this.props.date;
            this.props.setDate(currentDate);
        }
    }

    showModal() {
        if (this._isMounted && Platform.OS === 'android') {
            this.setState({ showDateModalAndroid: true });
        }
    }

    render() {
        if (!this.props.validDates) {
            return <></>;
        }

        if (Platform.OS === 'android') {
            return <>
                <View style={styles.dateInputContainer}>
                    <Text style={[themeStyles.fontColorSub, styles.labelText]}>
                        {this.props.label + ': ' + new Date(this.props.date).toLocaleDateString()}
                    </Text>
                    <CloutFeedButton
                        styles={styles.button}
                        title={'Change'}
                        onPress={this.showModal.bind(this)}
                    />
                </View>

                {
                    this.state.showDateModalAndroid && <DateTimePicker
                        style={styles.pickerContainer}
                        testID="dateTimePicker"
                        value={new Date(this.props.date)}
                        is24Hour={true}
                        display={'default'}
                        onChange={this.onDateChange.bind(this)}
                        textColor={themeStyles.fontColorMain.color}
                        minimumDate={new Date(Date.now())}
                    />
                }
            </>;
        }

        return <View style={styles.dateInputContainer}>
            <Text style={[themeStyles.fontColorSub, styles.labelText]}>
                {this.props.label}:{' '}
            </Text>
            <DateTimePicker
                style={styles.pickerContainer}
                testID="dateTimePicker"
                value={new Date(this.props.date)}
                is24Hour={true}
                display={'spinner'}
                onChange={this.onDateChange.bind(this)}
                textColor={themeStyles.fontColorMain.color}
                minimumDate={new Date(Date.now())}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        dateInputContainer: {
            width: '83%',
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        labelText: {
            fontSize: 14,
            width: Platform.OS === 'android' ? '50%' : '20%',
        },
        pickerContainer: {
            width: '80%',
            height: 100,
        },
        button: {
            width: '35%'
        }
    }
);
