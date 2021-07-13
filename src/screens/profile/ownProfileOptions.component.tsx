import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { themeStyles } from '@styles/globalColors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { snackbar } from '@services/snackbar';
import * as Clipboard from 'expo-clipboard';
import { eventManager } from '@globals/injector';
import { EventType } from '@types';
import CloutFeedButton from '@components/cloutfeedButton.component';

interface Props {
    navigation: NavigationProp<any>;
    publicKey: string;
    username: string;
}

export default class OwnProfileOptionsComponent extends React.Component<Props> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.onOwnProfileOptionsClick = this.onOwnProfileOptionsClick.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    handleEditButtonPress = () => {
        this.props.navigation.navigate('EditProfile');
    }

    async onOwnProfileOptionsClick() {
        const options = ['Open in Browser', 'Copy Public Key', 'Cancel'];
        const callback = async (p_optionIndex: number) => {
            switch (p_optionIndex) {
                case 0:
                    Linking.openURL(`https://bitclout.com/u/${this.props.username}`);
                    break;
                case 1:
                    Clipboard.setString(this.props.publicKey as string);
                    snackbar.showSnackBar(
                        {
                            text: 'Public key copied to clipboard.'
                        }
                    );
                    break;
            }
        }
        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [] }
            }
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <CloutFeedButton
                    title={'Edit Profile'}
                    onPress={this.handleEditButtonPress}
                    styles={styles.optionButton}
                />
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={this.onOwnProfileOptionsClick}
                >
                    <Feather name="more-horizontal" size={24} color={themeStyles.fontColorMain.color} />
                </TouchableOpacity>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionButton: {
        marginHorizontal: 10,
    },
})