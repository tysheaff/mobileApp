import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
import { Profile } from '@types'
import { themeStyles } from '@styles/globalColors';
import { NavigationProp } from "@react-navigation/native";
import { settingsGlobals } from '@globals/settingsGlobals';

interface Props {
    profile: Profile;
    navigation: NavigationProp<any>;
    unblockUser: (publicKey: string) => void;
}

interface State {
    isWorking: boolean;
}

export default class BlockedUserComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isWorking: true
        }

        this.handleBlock = this.handleBlock.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State) {
        return this.props.profile !== p_nextProps.profile ||
            this.state.isWorking !== p_nextState.isWorking;
    }

    goToProfile(p_profile: Profile) {
        if (p_profile.Username !== 'anonymous') {
            (this.props.navigation as any).push('UserProfile', {
                publicKey: p_profile.PublicKeyBase58Check,
                username: p_profile.Username,
                key: 'Profile_' + p_profile.PublicKeyBase58Check
            });
        }
    }

    async handleBlock(p_publicKey: string) {
        this.setState({ isWorking: false });
        await this.props.unblockUser(p_publicKey);
        if (this._isMounted) {
            this.setState({ isWorking: true });
        }
    }

    render() {
        const publicKey = this.props.profile.PublicKeyBase58Check;
        return (
            <TouchableOpacity style={[styles.container, themeStyles.borderColor]} onPress={() => this.goToProfile(this.props.profile)} activeOpacity={1}>
                <View style={styles.rowContainer}>
                    <Image
                        style={styles.profileImage}
                        source={{ uri: this.props.profile.ProfilePic }}
                    />
                    <Text style={themeStyles.fontColorMain}>{this.props.profile.Username}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => this.state.isWorking ? this.handleBlock(publicKey) : undefined}
                    style={[
                        styles.unblockBtn,
                        { backgroundColor: this.state.isWorking ? 'black' : themeStyles.buttonDisabledColor.backgroundColor },
                        themeStyles.buttonBorderColor,
                        { borderWidth: settingsGlobals.darkMode ? 1 : 0 }]}>
                    <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    profileImage: {
        width: 35,
        height: 35,
        borderRadius: 6,
        marginRight: 12
    },
    unblockBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    unblockText: {
        color: 'white'
    }
})