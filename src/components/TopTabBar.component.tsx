import { eventManager } from '@globals/injector';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { EventType } from '@types';
import { themeStyles } from '@styles/globalColors';

export default function TopTabBarComponent({ state, descriptors, navigation }: any) {

    const onPress = (p_route: any, p_isFocused: boolean, p_index: number) => {

        const event = navigation.emit({
            type: 'tabPress',
            target: p_route.key,
            canPreventDefault: true,
        });

        if (!p_isFocused && event.preventDefault) {
            navigation.navigate(p_route.name);
            dispatchEvent(p_index);
        }

    };

    const dispatchEvent = (p_index: number) => {
        eventManager.dispatchEvent(
            EventType.SwitchSearchTab,
            {
                tabName: state.routes[p_index].name, isFocused: state.index === p_index
            }
        );
    }

    dispatchEvent(state.index);
    return <View style={[styles.container, themeStyles.containerColorMain]}>

        {
            state.routes.map(
                (route: any, index: any) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel ? options.title : route.name;
                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={1}
                            accessibilityState={state.index === index ? { selected: true } : {}}
                            onPress={() => onPress(route, state.index === index, index)}
                            style={[styles.tab, state.index === index && [styles.activeTab, { borderBottomColor: themeStyles.fontColorMain.color }]]}
                        >
                            <Text style={state.index === index ? [themeStyles.fontColorMain, styles.activeTabText] : themeStyles.fontColorSub}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                }
            )
        }
    </View>
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    tab: {
        paddingVertical: 5,
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activeTab: {
        borderBottomWidth: 1,
    },
    activeTabText: {
        fontWeight: 'bold'
    }
})