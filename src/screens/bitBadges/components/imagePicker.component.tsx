import React from 'react';
import { View, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { signing } from '@services/authorization/signing';
import { globals } from '@globals/globals';
import { api } from '@services';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { settingsGlobals } from '@globals/settingsGlobals';

const mime = require('mime');

interface Props {
    badgeImage: string;
    imageLoading: boolean;
    setBadgeImage: (imageUrl: string) => void;
    setLoading: (loading: boolean) => void;
}

export class ImageInput extends React.Component<Props> {

    private _isMounted = false;

    private _refreshColor = settingsGlobals.darkMode ? 'white' : 'gray';

    constructor(props: Props) {
        super(props);
        this.pickImage = this.pickImage.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private async pickImage() {
        if (Platform.OS !== 'web') {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert(
                    'In order to be able to choose one of your images and attach it to your comment, we need access to your photos.'
                );
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true,
            allowsEditing: true,
        });

        if (!result.cancelled && result.type === 'image') {
            if (this._isMounted) {
                this.props.setLoading(true);
            }

            const newImageUri =
                Platform.OS === 'android'
                    ? result.uri
                    : result.uri.replace('file://', '');

            const file = {
                name: result.uri.split('/').pop(),
                type: mime.getType(newImageUri),
                uri: newImageUri,
            };

            try {
                const jwt = await signing.signJWT();
                const promises = [
                    Platform.OS === 'android'
                        ? api.uploadImageAndroid(globals.user.publicKey, jwt, file)
                        : api.uploadImage(globals.user.publicKey, jwt, file),
                ];

                const responses: any[] = await Promise.all(promises);
                const imageUrl = responses[0].ImageURL;

                if (this._isMounted) {
                    this.props.setBadgeImage(imageUrl);
                }
            } catch (error) {
                globals.defaultHandleError(error);
            } finally {
                if (this._isMounted) {
                    this.props.setLoading(false);
                }
            }
        }
    }

    render() {
        return <>
            <View style={styles.badgeImageContainer}>
                {
                    this.props.imageLoading ? <View style={[styles.badgeImage]}>
                        <ActivityIndicator color={this._refreshColor} />
                    </View>
                        : <Image
                            style={styles.badgeImage}
                            source={{
                                uri: this.props.badgeImage
                                    ? this.props.badgeImage
                                    : 'https://images.bitclout.com/59638de19a21210d7ddd47ecec5ec041532930d5ec76b88b6ccebb14b2e6f571.webp',
                            }}
                        />
                }
            </View>

            <CloutFeedButton title="Change Image" onPress={this.pickImage.bind(this)} />
        </>;
    }
}

const styles = StyleSheet.create(
    {
        badgeImageContainer: {
            marginTop: '10%',
            marginBottom: 10,
            marginHorizontal: 10
        },
        badgeImage: {
            height: 100,
            width: 100,
            borderRadius: 16,
            justifyContent: 'center',
        }
    }
);
