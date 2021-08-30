import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, InputAccessoryView, Platform, Dimensions, KeyboardAvoidingView, Alert } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { Fontisto, Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageGalleryComponent } from './imageGallery.component';
import { themeStyles } from '@styles';
import { settingsGlobals } from '../globals/settingsGlobals';
import { EventType, Post, Profile } from '@types';
import { PostComponent } from './post/post.component';
import { useNavigation, useRoute } from '@react-navigation/core';
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types';
import { MentionInput, MentionSuggestionsProps, replaceMentionValues } from 'react-native-controlled-mentions';
import { UserSuggestionList } from './userSuggestionList.component';
import { parseVideoLinkAsync } from '@services/videoLinkParser';
import { CloutTagSuggestionList } from './cloutTagSuggestionList.component';
import CloutFeedVideoComponent from './post/cloutFeedVideo.component';
import { eventManager } from '@globals/injector';
import { wait } from '@services/promiseHelper';
import CloutFeedButton from '@components/cloutfeedButton.component';
import ProfileInfoCardComponent from './profileInfo/profileInfoCard.component';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    profile: Profile,
    postText: string,
    setPostText: (postText: string) => void,
    editedPostImageUrls: string[],
    setImagesBase64: Dispatch<SetStateAction<string[]>>,
    recloutedPost?: Post,
    videoLink: string,
    setVideoLink: (link: string) => void;
    newPost: boolean;
}

export function CreatePostComponent(
    { profile, postText, setPostText, editedPostImageUrls, setImagesBase64, recloutedPost, videoLink, setVideoLink, newPost }: Props) {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const route = useRoute();

    const mentionPartTypes = [
        {
            trigger: '@',
            renderSuggestions: UserSuggestionList,
            isBottomMentionSuggestionsRender: true,
            isInsertSpaceAfterMention: true,
            allowedSpacesCount: 0,
            textStyle: [styles.link, themeStyles.linkColor]
        },
        {
            trigger: '#',
            renderSuggestions: CloutTagSuggestionList as (props: MentionSuggestionsProps) => React.ReactNode,
            isBottomMentionSuggestionsRender: true,
            isInsertSpaceAfterMention: true,
            allowedSpacesCount: 0,
            textStyle: [styles.link, themeStyles.linkColor]
        },
        {
            trigger: '$',
            renderSuggestions: UserSuggestionList,
            isBottomMentionSuggestionsRender: true,
            isInsertSpaceAfterMention: true,
            allowedSpacesCount: 0,
            textStyle: [styles.link, themeStyles.linkColor]
        }
    ];
    const isMounted = useRef<boolean>(true);
    const [internalPostText, setInternalPostText] = useState(postText);
    const [imageUrls, setImageUrls] = useState<string[]>(editedPostImageUrls);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [insertVideo, setInsertVideo] = useState<boolean>(!!videoLink);
    const [internalVideoLink, setInternalVideoLink] = useState<string>(videoLink);
    const [textSelection, setTextSelection] = useState<any>(newPost ? { start: 0, end: 0 } : undefined);

    const scrollViewRef = useRef<ScrollView>(null);
    let inputRef: any;

    const inputAccessoryViewId = Platform.OS === 'ios' ? 'inputAccessoryViewID' : undefined;

    useEffect(
        () => {

            if (newPost) {
                onMentionChange('\n\nPosted by @[cloutfeed](undefined)');
            }
            return () => {
                isMounted.current = false;
            };
        },
        []
    );

    function pickImage(): void {

        if (imageUrls?.length === 5) {
            alert('You have reached the maximum number of images you can attach per post.');
            return;
        }
        let result: ImagePicker.ImagePickerResult;

        const options = ['Camera', 'Gallery', 'Cancel'];
        const callback = async (optionIndex: number) => {
            switch (optionIndex) {
                case 0:
                    if (Platform.OS !== 'web') {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            alert('In order to be able to capture one of your images and attach it to your comment, we need access to your camera.');
                            return;
                        }
                    }

                    await wait(250);
                    result = await ImagePicker.launchCameraAsync(
                        {
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: undefined
                        }
                    );
                    break;
                case 1:
                    if (Platform.OS !== 'web') {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            alert('In order to be able to choose one of your images and attach it to your comment, we need access to your photos.');
                            return;
                        }
                    }

                    await wait(250);
                    result = await ImagePicker.launchImageLibraryAsync(
                        {
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: undefined
                        }
                    );
                    break;
            }
            if (!result.cancelled) {
                if (result.type === 'image') {
                    if (isMounted) {
                        const uri = (result as ImageInfo).uri;
                        setImageUrls(previous => [...previous, uri]);
                        setImagesBase64((previous: string[]) => [...previous, uri]);
                        setSelectedImageIndex(imageUrls.length);
                    }
                } else {
                    alert('We just support images at the moment.');
                }
            }
        };

        eventManager.dispatchEvent(
            EventType.ToggleActionSheet,
            {
                visible: true,
                config: { options, callback, destructiveButtonIndex: [] }
            }
        );
    }

    function onRemoveImage(index: number): void {
        setImageUrls(
            (previous: string[]) => {
                const copy: string[] = previous.slice(0);
                copy.splice(index, 1);
                return copy;
            }
        );
        setImagesBase64(
            (previous: string[]) => {
                const copy = previous.slice(0);
                copy.splice(index, 1);
                return copy;
            }
        );
    }

    async function onPasteVideoLink(): Promise<void> {
        const videoLink = await Clipboard.getStringAsync();
        if (!videoLink) {
            Alert.alert('Clipboard is empty!', 'Please make sure you copied the link correctly.');
            return;
        }

        const parsedVideoLink = await parseVideoLinkAsync(videoLink);

        if (parsedVideoLink) {
            if (isMounted) {
                setInternalVideoLink(parsedVideoLink);
                setVideoLink(parsedVideoLink);
            }

        } else {
            Alert.alert('Error', 'The video link is not valid. We just support YouTube, TikTok, Vimeo, Spotify, SoundCloud and GIPHY links.');
        }
    }

    function onMentionChange(value: string): void {
        const replaceMention = replaceMentionValues(value, ({ name, trigger }) => `${trigger}${name}`);
        setPostText(replaceMention);
        setInternalPostText(value);
        inputRef?.focus();
    }

    return <ScrollView
        ref={scrollViewRef}
        bounces={false}
        keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
            <ProfileInfoCardComponent
                profile={profile}
                noCoinPrice={true}
                navigation={navigation}
                imageSize={30}
                peekDisabled={true}
            />
        </View>

        <MentionInput
            inputRef={ref => inputRef = ref}
            style={[styles.textInput, themeStyles.fontColorMain]}
            placeholder="Share your ideas with the world..."
            placeholderTextColor={themeStyles.fontColorSub.color}
            multiline
            maxLength={2048}
            value={internalPostText}
            autoFocus
            inputAccessoryViewID={inputAccessoryViewId}
            onChange={(value) => onMentionChange(value)}
            keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
            selection={textSelection}
            onSelectionChange={() => {
                setTextSelection(undefined);
            }}
            partTypes={mentionPartTypes}
        />
        {
            imageUrls?.length > 0 &&
            <ImageGalleryComponent
                goToStats={() => undefined}
                imageUrls={imageUrls}
                removable={true}
                onRemove={onRemoveImage}
                selectedImageIndex={selectedImageIndex} />
        }

        {
            insertVideo && !internalVideoLink ?
                <View style={styles.insertVideoContainer}>
                    <TouchableOpacity style={styles.videoIconTextContainer} onPress={onPasteVideoLink} >
                        <Ionicons name="md-videocam-outline" size={60} color={themeStyles.fontColorMain.color} />
                        <Text style={[styles.insertVideoText, themeStyles.fontColorMain]}>Click here to paste your video URL</Text>
                        <Text style={[styles.insertVideoText, themeStyles.fontColorMain]}>YouTube, TikTok, Vimeo, Spotify, SoundCloud and GIPHY links are supported</Text>
                    </TouchableOpacity>
                    <CloutFeedButton
                        styles={styles.cancelBtn}
                        title={'Cancel'}
                        onPress={() => setInsertVideo(false)}
                    />
                </View>
                : undefined
        }

        {
            insertVideo && internalVideoLink ?
                <View>
                    <View style={styles.removeButtonContainer}>
                        <TouchableOpacity style={styles.removeButton} onPress={() => { setInternalVideoLink(''); setVideoLink(''); setInsertVideo(false); }}>
                            <Fontisto name="close-a" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                    <CloutFeedVideoComponent embeddedVideoLink={internalVideoLink} />
                </View>
                :
                undefined
        }

        {
            recloutedPost ?
                <View style={[styles.recloutedPostContainer, themeStyles.recloutBorderColor]}>
                    <PostComponent
                        route={route}
                        navigation={navigation}
                        post={recloutedPost}
                        disablePostNavigate={true}
                        disableProfileNavigation={true}
                        actionsDisabled={true}
                        hideBottomBorder={true}></PostComponent>
                </View>
                :
                undefined
        }
        {
            Platform.OS === 'ios' ?
                <InputAccessoryView nativeID={inputAccessoryViewId}>
                    <View style={[styles.inputAccessory, themeStyles.containerColorMain, themeStyles.recloutBorderColor]}>
                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={pickImage}>
                            <Feather name="image" size={20} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={() => { setInsertVideo(true); scrollViewRef.current?.scrollToEnd({ animated: true }); }}>
                            <Ionicons name="md-videocam-outline" size={24} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Video</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
                :
                <KeyboardAvoidingView
                    behavior={'height'}
                    keyboardVerticalOffset={65}>
                    <View style={[styles.inputAccessory, themeStyles.containerColorMain, themeStyles.recloutBorderColor]}>
                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={pickImage}>
                            <Feather name="image" size={20} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputAccessoryButton} onPress={() => setInsertVideo(true)}>
                            <Ionicons name="md-videocam-outline" size={24} color={themeStyles.fontColorMain.color} />
                            <Text style={[styles.inputAccessoryButtonText, themeStyles.fontColorMain]}>Video</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
        }
        {newPost && <Text style={[styles.hintText, themeStyles.fontColorSub]}>Include @CloutFeed signature and receive 1-4 Diamonds on every new post. (Max. 5 posts daily)</Text>}
        <View style={styles.emptyView} />
    </ScrollView>;
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            paddingTop: 10,
            paddingLeft: 10,
        },
        textInput: {
            marginHorizontal: 10,
            fontSize: 16,
            width: Dimensions.get('window').width - 20,
            minHeight: 40,
            marginTop: 10,
            maxHeight: 150
        },
        inputAccessory: {
            paddingLeft: 16,
            paddingVertical: 8,
            borderTopWidth: 1,
            flexDirection: 'row',
            alignItems: 'center'
        },
        inputAccessoryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16
        },
        inputAccessoryButtonText: {
            marginLeft: 6
        },
        insertVideoContainer: {
            height: 200,
            width: '75%',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 'auto'
        },
        videoIconTextContainer: {
            alignItems: 'center'
        },
        insertVideoText: {
            textAlign: 'center'
        },
        cancelBtn: {
            marginTop: 10
        },
        recloutedPostContainer: {
            marginHorizontal: 10,
            borderWidth: 1,
            padding: 10,
            paddingBottom: 4,
            borderRadius: 8,
            marginTop: 10
        },
        removeButtonContainer: {
            backgroundColor: '#c42326',
            width: 30,
            height: 30,
            zIndex: 10,
            position: 'absolute',
            top: 10,
            right: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            opacity: 0.8
        },
        removeButton: {
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
        },
        link: {
            fontWeight: '500'
        },
        emptyView: {
            height: 500
        },
        hintText: {
            marginHorizontal: 10,
            marginTop: 5,
            fontSize: 10
        }
    }
);
