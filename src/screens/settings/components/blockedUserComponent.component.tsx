import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Profile } from '@types';
import { themeStyles } from '@styles/globalColors';
import { ParamListBase } from '@react-navigation/native';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';
import ProfileInfoCardComponent from '@components/profileInfo/profileInfoCard.component';

interface Props {
    profile: Profile;
    navigation: StackNavigationProp<ParamListBase>;
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
            isWorking: false
        };

        this.handleBlock = this.handleBlock.bind(this);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        return this.props.profile !== nextProps.profile ||
            this.state.isWorking !== nextState.isWorking;
    }

    private goToProfile(profile: Profile): void {
        if (profile.Username !== 'anonymous') {
            this.props.navigation.push('UserProfile', {
                publicKey: profile?.PublicKeyBase58Check,
                username: profile?.Username,
                key: 'Profile_' + profile?.PublicKeyBase58Check
            });
        }
    }

    private handleBlock(publicKey: string): void {
        this.setState({ isWorking: true });
        this.props.unblockUser(publicKey);
        if (this._isMounted) {
            this.setState({ isWorking: false });
        }
    }

    render() {
        const publicKey = this.props.profile?.PublicKeyBase58Check;
        return <TouchableOpacity style={[styles.container, themeStyles.borderColor]} onPress={() => this.goToProfile(this.props.profile)} activeOpacity={1}>
            <ProfileInfoCardComponent
                navigation={this.props.navigation}
                profile={this.props.profile}
                noCoinPrice={true}
            />
            <CloutFeedButton
                disabled={this.state.isWorking}
                title={'Unblock'}
                onPress={() => this.state.isWorking ? undefined : this.handleBlock(publicKey)}
            />
        </TouchableOpacity>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 14,
            borderBottomWidth: 1,
        },
    }
);
