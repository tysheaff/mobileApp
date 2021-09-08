import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Image, StyleSheet, Text, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { AppearanceScreen } from '@screens/appearance.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import { SettingsScreen } from '@screens/settings/settings.screen';
import { settingsGlobals } from '@globals';
import { themeStyles } from '@styles';
import BlockedUsersScreen from '@screens/settings/blockedUsers.screen';
import { SavedPostsScreen } from '@screens/savedPosts/savedPosts.screen';
import { stackConfig } from './stackNavigationConfig';
import HapticsScreen from '@screens/settings/haptics.screen';
import NotificationsSettingsScreen from '@screens/settings/notificationsSettings.screen';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { FeedSettingsScreen } from '@screens/feedSettings.screen';
import { SharedStackScreens } from './sharedStackScreens';

const ProfileStack = createStackNavigator();

export default function ProfileStackScreen() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    return <ProfileStack.Navigator
        screenOptions={({ navigation }: any) => ({
            ...stackConfig,
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
                () => ({
                    headerTitle: ' ',
                    headerLeft: () =>
                        <View style={styles.headerContainer}>
                            {
                                settingsGlobals.darkMode ?
                                    <Image
                                        style={styles.logo}
                                        source={require('../../assets/icon-black.png')}
                                    />
                                    :
                                    <Image
                                        style={styles.logo}
                                        source={require('../../assets/icon-white.png')}
                                    />
                            }
                            <Text style={{
                                marginLeft: -10,
                                fontWeight: '700',
                                fontSize: 20,
                                color: themeStyles.fontColorMain.color
                            }}>CloutFeed</Text>
                        </View>
                    ,
                    headerRight: () => (
                        <View style={styles.headerContainer}>
                            {
                                <TouchableOpacity
                                    style={styles.settingsIcon}
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
                headerTitle: 'Settings',
                headerBackTitle: ' ',
            }}
            name="Settings"
            component={SettingsScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Blocked Users',
                headerBackTitle: ' ',
            }}
            name="BlockedUsers"
            component={BlockedUsersScreen}
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
                headerTitle: 'Haptics',
                headerBackTitle: ' ',
            }}
            name="HapticsSettings"
            component={HapticsScreen}
        />
        <ProfileStack.Screen
            options={{
                headerTitle: 'Notifications',
                headerBackTitle: ' ',
            }}
            name="NotificationsSettings"
            component={NotificationsSettingsScreen}
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
                headerTitle: 'Saved Posts',
                headerBackTitle: ' ',
            }}
            name="SavedPosts"
            component={SavedPostsScreen}
        />

        {
            SharedStackScreens.map((item: any, index: number) => <ProfileStack.Screen
                key={`${item.name as string}_${index}`}
                options={item.options}
                name={item.name}
                component={item.component}
            />
            )
        }
    </ProfileStack.Navigator>;
}

const styles = StyleSheet.create(
    {
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        logo: {
            width: 50,
            height: 40
        },
        settingsIcon: {
            marginRight: 8,
            paddingHorizontal: 4
        },
    }
);
