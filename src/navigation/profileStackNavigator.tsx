import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View, Image, StyleSheet, Text, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AppearanceScreen } from '@screens/appearance.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import { ProfileFollowersScreen } from '@screens/profileFollowers.screen';
import { SettingsScreen } from '@screens/settings/settings.screen';
import { globals, settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { PostScreen } from '@screens/post.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { IdentityScreen } from '@screens/login/identity.screen';
import { FeedSettingsScreen } from '@screens/feedSettings.screen';
import { PostStatsScreen } from '@screens/postStats/postStats.screen';

const ProfileStack = createStackNavigator();

export default function ProfileStackScreen() {
    return (
        <ProfileStack.Navigator
            screenOptions={({ navigation }: any) => ({
                headerTitleStyle: { alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                headerStyle: {
                    backgroundColor: themeStyles.containerColorMain.backgroundColor,
                    shadowOpacity: 0,
                    elevation: 0
                },
                headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                    <Ionicons name="chevron-back" size={32} color="#007ef5" />
                </TouchableOpacity>
            })}
        >
            <ProfileStack.Screen
                options={
                    ({ navigation }) => ({
                        headerTitle: ' ',
                        headerLeft: () =>
                            <View style={styles.headerContainer}>
                                {
                                    settingsGlobals.darkMode ?
                                        <Image
                                            style={styles.logo}
                                            source={require('../../assets/icon-black.png')}
                                        ></Image>
                                        :
                                        <Image
                                            style={styles.logo}
                                            source={require('../../assets/icon-white.png')}
                                        ></Image>
                                }
                                <Text style={{ marginLeft: -10, fontWeight: '700', fontSize: 20, color: themeStyles.fontColorMain.color }}>CloutFeed</Text>
                            </View>
                        ,
                        headerRight: () => (
                            <View style={styles.headerContainer}>
                                {
                                    <TouchableOpacity
                                        style={{ marginRight: 8, paddingRight: 4, paddingLeft: 4 }}
                                        onPress={() => navigation.navigate('Settings')}
                                    >
                                        <Feather name="settings" size={24} color={themeStyles.fontColorMain.color} />
                                    </TouchableOpacity>
                                }
                            </View>
                        ),
                    })
                }
                name="Profile"
                component={ProfileScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="UserProfile"
                component={ProfileScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            />
            <ProfileStack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? (route.params as any).username : 'Profile',
                            headerBackTitle: ' '
                        }
                    )
                }
                name="ProfileFollowers"
                component={ProfileFollowersScreen}
            />
            <ProfileStack.Screen
                options={
                    ({ route }) => (
                        {
                            title: route.params ? '$' + (route.params as any).username : 'Creator Coin',
                            headerTitleStyle: { fontSize: 20, alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                            headerBackTitle: ' '
                        }
                    )
                }
                name="CreatorCoin"
                component={CreatorCoinScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'Settings',
                    headerBackTitle: ' ',
                }}
                name="Settings"
                component={SettingsScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'Appearance',
                    headerBackTitle: ' ',
                }}
                name="Appearance"
                component={AppearanceScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'Feed Settings',
                    headerBackTitle: ' ',
                }}
                name="FeedSettings"
                component={FeedSettingsScreen}
            />
            <ProfileStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            ></ProfileStack.Screen>

            <ProfileStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="PostStats"
                component={PostStatsScreen}
            ></ProfileStack.Screen>

            <ProfileStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: (route.params as any).newPost ? 'New Post' : (route.params as any).comment ? 'New Comment' :
                                (route.params as any).editPost ? 'Edit Post' : 'Reclout Post',
                            headerBackTitle: 'Cancel',
                            headerRight: () => (
                                <TouchableOpacity
                                    style={[styles.postButton, themeStyles.buttonBorderColor]}
                                    onPress={() => globals.createPost()}
                                >
                                    <Text style={styles.postButtonText}>Post</Text>
                                </TouchableOpacity>
                            )
                        }
                    )}
                name="CreatePost"
                component={CreatePostScreen}
            ></ProfileStack.Screen>

            <ProfileStack.Screen
                options={
                    {
                        headerStyle: { backgroundColor: '#121212', shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                        headerTitleStyle: { color: 'white', fontSize: 20 }
                    }
                }
                name="Identity" component={IdentityScreen}
            ></ProfileStack.Screen>
        </ProfileStack.Navigator>
    )
};

const styles = StyleSheet.create(
    {
        headerContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        postButton: {
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            paddingRight: 12,
            paddingLeft: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 4,
            borderWidth: 1
        },
        postButtonText: {
            color: 'white'
        },
        logo: {
            width: 50,
            height: 40
        }
    }
)