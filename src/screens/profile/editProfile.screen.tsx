import { globals } from '@globals/globals';
import { api } from '@services';
import React, { Component } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform, StyleSheet, Text, View, TextInput, ScrollView, Alert } from 'react-native';
import { Profile } from '@types';
import { themeStyles } from '@styles/globalColors';
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';
import { NavigationProp } from '@react-navigation/core';
import { settingsGlobals } from '@globals/settingsGlobals';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { ParamListBase } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<ParamListBase>
}

interface State {
    profilePic: string,
    username: string,
    description: string,
    founderReward: string,
    loading: boolean
}

export class EditProfileScreen extends Component<Props, State> {
    private _isMounted = false;

    constructor(props: Props) {
        super(props);
        this.state = {
            profilePic: '',
            username: '',
            description: '',
            founderReward: '',
            loading: true,
        };

        this.pickImage = this.pickImage.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleFounderRewardsChange = this.handleFounderRewardsChange.bind(this);
    }

    componentDidMount() {
        this.updateNavigation();
        this.loadSingleProfile();
        this._isMounted = true;
    }

    componentWillUnmout() {
        this._isMounted = false;
    }

    updateNavigation = () => {
        this.props.navigation.setOptions({
            headerRight: () => <CloutFeedButton
                title={'Save'}
                onPress={this.updateProfile}
                styles={styles.button}
            />
            ,
            headerTitleStyle: {
                color: themeStyles.fontColorMain.color,
                alignSelf: 'center'
            }
        });
    }

    updateProfile = (): void => {
        if (this.state.loading) {
            return;
        }

        const username = this.state.username.trim();
        if (!username) {
            Alert.alert('Error', 'Please enter a username.');
            return;
        }

        const description = this.state.description.trim();
        if (!description) {
            Alert.alert('Error', 'Please enter a description.');
            return;
        }

        if (!this.state.founderReward.trim()) {
            Alert.alert('Error', 'Please enter a founder reward.');
            return;
        }

        const profilePic = this.state.profilePic === api.getSingleProfileImage(globals.user.publicKey) ? '' : this.state.profilePic;

        this.setState({ loading: true });

        const founderRewardText = this.state.founderReward.split(',').join('.');
        const founderReward = Number(founderRewardText) * 100;

        api.updateProfile(
            globals.user.publicKey, username, description, profilePic, founderReward
        ).then(
            async p_response => {
                const transactionHex = p_response.TransactionHex;
                const signedTransaction = await signing.signTransaction(transactionHex);
                await api.submitTransaction(signedTransaction).then(
                    () => {
                        if (this._isMounted) {
                            if (globals.user.username !== this.state.username) {
                                globals.user.username = this.state.username;
                            }
                            setTimeout(() => this.props.navigation.navigate('Profile', { profileUpdated: true }), 2000);
                        }
                    },
                    p_error => {
                        if (this._isMounted) {
                            this.setState({ loading: false });
                            globals.defaultHandleError(p_error);
                        }
                    }
                );
            }
        ).catch(
            p_error => {
                if (this._isMounted) {
                    this.setState({ loading: false });

                    const usernameExists = !!p_error?.error && p_error.error.indexOf('Username') !== -1 && p_error.error.indexOF('already exists') !== -1;

                    if (usernameExists) {
                        Alert.alert('Username exists', `The username ${this.state.username} already exists. Please choose a different username.`);
                    } else {
                        globals.defaultHandleError(p_error);
                    }
                }
            }
        );
    }

    pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('In order to be able to choose one of your images and attach it to your comment, we need access to your photos.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync(
            {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                base64: true
            }
        );
        if (!result.cancelled && result.type === 'image') {
            const base64 = (result as ImageInfo).base64 as string;
            const base64Image = base64;

            if (this._isMounted) {
                this.setState({ profilePic: base64Image });
            }
        }
    };

    loadSingleProfile = async () => {
        try {
            const response = await api.getSingleProfile(globals.user.username);
            const newProfile = response.Profile as Profile;

            if (this._isMounted) {
                this.setState(
                    {
                        profilePic: api.getSingleProfileImage(globals.user.publicKey),
                        username: newProfile.Username,
                        description: newProfile.Description,
                        founderReward: String(newProfile.CoinEntry.CreatorBasisPoints / 100),
                        loading: false
                    }
                );
            }
        } catch {
            this.props.navigation.goBack();
        }
    }

    handleDescriptionChange = (p_text: string) => {
        this.setState({ description: p_text });
    }

    handleFounderRewardsChange = (p_text: string) => {
        const numberText = p_text.split(',').join('.');
        const founderRewardNumber = Number(numberText);

        if (founderRewardNumber >= 0 && founderRewardNumber <= 100) {
            this.setState({ founderReward: p_text });
        }
    }

    render() {
        if (this.state.loading) {
            return (
                <CloutFeedLoader />
            );
        }

        return (
            <ScrollView style={[styles.scrollView, themeStyles.containerColorMain]}>
                <View style={[styles.container, themeStyles.containerColorMain]}>
                    <View style={[styles.profilePicContainer]}>
                        <Image
                            style={styles.profilePic}
                            source={{ uri: this.state.profilePic ? this.state.profilePic : 'https://i.imgur.com/vZ2mB1W.png' }}>
                        </Image>
                    </View>
                    <CloutFeedButton
                        title={'Change Image'}
                        onPress={this.pickImage}
                        styles={styles.button} />
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Username</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, themeStyles.borderColor]}
                            value={this.state.username}
                            onChangeText={(p_text: string) => {
                                this.setState({ username: p_text });
                            }}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Description</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, themeStyles.borderColor]}
                            value={this.state.description}
                            multiline={true}
                            maxLength={180}
                            onChangeText={this.handleDescriptionChange}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                    <View style={[styles.inputContainer]}>
                        <Text style={[themeStyles.fontColorSub]}>Founder reward percentage</Text>
                        <TextInput
                            style={[styles.textInput, themeStyles.fontColorMain, themeStyles.borderColor]}
                            keyboardType='numeric'
                            value={this.state.founderReward}
                            onChangeText={this.handleFounderRewardsChange}
                            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                        />
                    </View>
                </View>

                <View style={{ height: 500 }}></View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1
    },
    container: {
        flex: 1,
        alignItems: 'center'
    },
    profilePicContainer: {
        marginTop: '10%',
        marginBottom: 10,
        marginRight: 10
    },
    profilePic: {
        height: 100,
        width: 100,
        borderRadius: 16,
    },
    button: {
        marginRight: 10,
    },
    inputContainer: {
        width: '96%',
        marginTop: 10
    },
    textInput: {
        borderColor: 'gray',
        borderBottomWidth: 1,
        paddingVertical: 4,
        width: '100%',
        marginBottom: 16
    }
});

export default EditProfileScreen;
