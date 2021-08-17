import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { globals } from '@globals/globals';
import { api } from '@services';
import { themeStyles } from '@styles/globalColors';
import { Profile } from '@types';
import ProfileInfoCardComponent from './profileInfo/profileInfoCard.component';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase, useNavigation } from '@react-navigation/native';

let lastKeyword;

export function UserSuggestionList({ keyword, onSuggestionPress }: { keyword: string, onSuggestionPress: (name: Profile) => void }): JSX.Element | null {
    const [suggestedMentions, setSuggestedMentions] = useState<Profile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

    const isMounted = useRef<boolean>(true);

    useEffect(
        () => {
            if (keyword !== null && keyword !== undefined) {
                getSuggestions();
            }

            () => {
                isMounted.current = false;
            };
        },
        [keyword]
    );

    if (keyword == null) {
        return null;
    }

    async function getSuggestions() {
        try {
            let response;
            lastKeyword = keyword;

            if (isMounted) {
                setLoading(true);
            }

            if (keyword?.length > 0) {
                response = await api.searchProfiles(globals.user.publicKey, keyword, 5);
            } else {
                response = await api.getLeaderBoard(globals.user.publicKey, 5);
            }

            if (lastKeyword !== keyword) {
                return;
            }

            const profiles = response.ProfilesFound as Profile[];

            for (const profile of profiles) {
                (profile as any).name = profile.Username;
            }

            if (isMounted) {
                setSuggestedMentions(profiles);
                setLoading(false);
            }
        } catch (error) {
            if (isMounted) {
                setSuggestedMentions([]);
                setLoading(false);
            }
        }
    }

    return <ScrollView style={[styles.container, themeStyles.borderColor]}>
        {
            loading ?
                <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                :
                suggestedMentions.map(
                    (mention: Profile) =>
                        <TouchableOpacity
                            key={mention.Username}
                            onPress={() => { onSuggestionPress(mention); }}
                            style={styles.userMentionCard}>
                            <ProfileInfoCardComponent
                                profile={mention}
                                navigation={navigation}
                                noCoinPrice={true}
                            />
                        </TouchableOpacity>
                )
        }
    </ScrollView>;
}

const styles = StyleSheet.create(
    {
        container: {
            borderTopWidth: 1
        },
        activityIndicator: {
            marginTop: 10
        },
        userMentionCard: {
            padding: 12,
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center'
        },
    }
);
