import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { CloutTag } from '@types';
import { cloutApi } from '@services/api/cloutApi';
import { Feather } from '@expo/vector-icons';

let lastKeyword;

interface Props {
    keyword: string;
    onSuggestionPress: ({ name }: { name: string }) => void;
}

export function CloutTagSuggestionList({ keyword, onSuggestionPress }: Props): JSX.Element | null {
    const [suggestedMentions, setSuggestedMentions] = useState<CloutTag[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    let mount = true;

    useEffect(
        () => {
            if (keyword !== null && keyword !== undefined) {
                getSuggestions();
            }

            () => {
                mount = false;
            };
        },
        [keyword]
    );

    if (keyword == null) {
        return null;
    }

    async function getSuggestions() {
        try {
            let cloutTags: CloutTag[];
            lastKeyword = keyword;

            if (mount) {
                setLoading(true);
            }

            if (keyword?.length > 0) {
                cloutTags = await cloutApi.searchCloutTags(keyword);
                if (cloutTags?.length > 0) {
                    cloutTags = cloutTags.slice(0, 5);
                }
            } else {
                cloutTags = await cloutApi.getTrendingClouts(5, 0);
            }

            if (lastKeyword !== keyword) {
                return;
            }

            if (mount) {
                setSuggestedMentions(cloutTags);
                setLoading(false);
            }
        } catch (error) {
            if (mount) {
                setSuggestedMentions([]);
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={[styles.container, themeStyles.borderColor]}>
            {
                loading ?
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color}></ActivityIndicator>
                    :
                    suggestedMentions.map(
                        p_mention => (
                            <TouchableOpacity
                                key={p_mention.clouttag}
                                style={[styles.cloutTagCard]}
                                activeOpacity={0.7}
                                onPress={() => { onSuggestionPress({ name: p_mention.clouttag }); }}>
                                <View style={[styles.cloutTagContainer, themeStyles.lightBorderColor]}>
                                    <Feather name="hash" size={22} color={themeStyles.fontColorMain.color} />
                                </View>
                                <View>
                                    <Text style={[styles.cloutTag, themeStyles.fontColorMain]}>#{p_mention.clouttag}</Text>
                                    <Text style={[themeStyles.fontColorSub, styles.count]}>{p_mention.count} posts</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    )
            }
        </ScrollView>
    );
}

const styles = StyleSheet.create(
    {
        container: {
            borderTopWidth: 1
        },
        activityIndicator: {
            marginTop: 10
        },
        cloutTagCard: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 10
        },
        cloutTagContainer: {
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 15,
            width: 55,
            height: 55,
            borderRadius: 50
        },
        cloutTag: {
            fontSize: 15,
            fontWeight: '700'
        },
        count: {
            fontSize: 13,
        }
    }
);
