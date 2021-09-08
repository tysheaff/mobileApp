import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { themeStyles } from '@styles';
import { stackConfig } from './stackNavigationConfig';
import { SearchHeaderComponent } from '@screens/search/components/searchHeader';
import SearchScreen from '@screens/search/search.screen';
import { DiscoveryTypeCreatorScreen } from '@screens/search/discoverTypeCreatorScreen';
import { DiscoveryType } from '@types';
import { SharedStackScreens } from './sharedStackScreens';

const SearchStack = createStackNavigator();

function getDiscoveryTypeCreatorTitle(discoveryType: DiscoveryType) {
    switch (discoveryType) {
        case DiscoveryType.CommunityProject:
            return 'Community Projects';
        case DiscoveryType.ValueCreator:
            return 'Value Creators';
        case DiscoveryType.Goddess:
            return 'Goddesses';
        case DiscoveryType.Developer:
            return 'Developers';
    }
}

export default function SearchStackScreen() {
    return (
        <SearchStack.Navigator
            screenOptions={
                ({ navigation }: any) => (
                    {
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
                    }
                )
            }
        >
            <SearchStack.Screen
                options={
                    () => (
                        {
                            headerLeft: () => <></>,
                            headerBackTitle: '',
                            headerTitleAlign: 'center',
                            headerTitle: () => <SearchHeaderComponent />,
                        }
                    )
                }
                name="Search"
                component={SearchScreen}
            />

            <SearchStack.Screen
                options={
                    ({ route }) => (
                        {
                            headerTitle: getDiscoveryTypeCreatorTitle((route.params as any)?.discoveryType),
                            headerBackTitle: ' '
                        }
                    )
                }
                name="DiscoveryTypeCreator"
                component={DiscoveryTypeCreatorScreen}
            />

            {
                SharedStackScreens.map((item: any, index: number) => <SearchStack.Screen
                    key={`${item.name as string}_${index}`}
                    options={item.options}
                    name={item.name}
                    component={item.component}
                />
                )
            }
        </SearchStack.Navigator>
    );
}
