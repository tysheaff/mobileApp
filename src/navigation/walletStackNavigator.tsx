import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Platform, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { WalletScreen } from '@screens/wallet/wallet.screen';
import { ProfileScreen } from '@screens/profile/profile.screen';
import EditProfileScreen from '@screens/profile/editProfile.screen';
import { ProfileFollowersScreen } from '@screens/profileFollowers.screen';
import { CreatorCoinScreen } from '@screens/creatorCoin/creatorCoin.screen';
import { PostScreen } from '@screens/post.screen';
import { CreatePostScreen } from '@screens/createPost.screen';
import { globals } from '@globals/globals';
import { IdentityScreen } from '@screens/login/identity.screen';
import { LogoHeaderComponent } from '@components/logoHeader.component';

const WalletStack = createStackNavigator();

export default function WalletStackScreen() {
    return (
        <WalletStack.Navigator
            screenOptions={({ navigation }) => ({
                headerTitleStyle: { alignSelf: 'center', color: themeStyles.fontColorMain.color, marginRight: Platform.OS === 'ios' ? 0 : 50 },
                headerStyle: {
                    backgroundColor: themeStyles.containerColorMain.backgroundColor,
                    shadowOpacity: 0,
                    elevation: 0
                },
                headerTitle: ' ',
                headerBackTitle: ' ',
                headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                    <Ionicons name="chevron-back" size={32} color="#007ef5" />
                </TouchableOpacity>
            })}
        >
            <WalletStack.Screen
                options={{
                    headerLeft: () => <LogoHeaderComponent></LogoHeaderComponent>,
                }}
                name="Wallet"
                component={WalletScreen}
            />

            <WalletStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="UserProfile"
                component={ProfileScreen}
            ></WalletStack.Screen>

            <WalletStack.Screen
                options={{
                    headerTitle: 'Edit Profile',
                    headerBackTitle: ' '
                }}
                name="EditProfile"
                component={EditProfileScreen}
            ></WalletStack.Screen>

            <WalletStack.Screen
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
            ></WalletStack.Screen>

            <WalletStack.Screen
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
            ></WalletStack.Screen>

            <WalletStack.Screen
                options={{
                    headerTitle: 'CloutFeed',
                    headerBackTitle: ' '
                }}
                name="Post"
                component={PostScreen}
            ></WalletStack.Screen>

            <WalletStack.Screen
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
            ></WalletStack.Screen>
            <WalletStack.Screen
                options={
                    {
                        headerStyle: { backgroundColor: '#121212', shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                        headerTitleStyle: { color: 'white', fontSize: 20 }
                    }
                }
                name="Identity" component={IdentityScreen} />
        </WalletStack.Navigator>
    )
};

const styles = StyleSheet.create(
    {
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
        }
    }
)