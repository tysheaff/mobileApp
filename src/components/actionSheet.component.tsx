import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { ActionSheetConfig } from '@services';
import { themeStyles } from '@styles';
import Modal from 'react-native-modal';
import { eventManager } from '@globals/injector';
import { EventType } from '@types';
import { settingsGlobals } from '@globals/settingsGlobals';

export function ActionSheet(props: { config: ActionSheetConfig }): JSX.Element {

    let _isMounted = true;

    useEffect(
        () => {
            return () => { _isMounted = false; };
        },
        []
    );

    function onOptionClick(p_optionIndex: number) {
        close();
        props.config?.callback(p_optionIndex);
    }

    function close() {
        if (_isMounted) {
            eventManager.dispatchEvent(EventType.ToggleActionSheet, { visible: false });
        }
    }

    return <Modal
        animationIn={'slideInUp'}
        animationOut={'slideOutDown'}
        swipeDirection='down'
        animationOutTiming={500}
        onSwipeComplete={close}
        onBackdropPress={close}
        onBackButtonPress={close}
        isVisible={true}
        style={styles.container}>
        <View style={[styles.optionsContainer, themeStyles.modalBackgroundColor]}>
            {
                props.config.headerDescription &&
                <View style={{ borderBottomWidth: 1, borderColor: settingsGlobals.darkMode ? '#2b2b2b' : '#e0e0e0' }}>
                    <Text style={[
                        styles.headerDescription,
                        themeStyles.fontColorSub]}
                    >{props.config.headerDescription}</Text>
                </View>
            }
            {
                props.config.options.slice(0, -1).map(
                    (p_option: string, p_index: number) =>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                p_index !== props.config.options.length - 2 && { borderBottomWidth: 1, borderColor: settingsGlobals.darkMode ? '#2b2b2b' : '#e0e0e0' },
                            ]}
                            key={p_index.toString()}
                            onPress={() => onOptionClick(p_index)}
                        >
                            <Text style={[
                                styles.optionText,
                                themeStyles.fontColorMain,
                                props.config.destructiveButtonIndex?.includes(p_index) && { color: '#f53636' },
                                props.config.mintingButton === p_index && { color: '#00803c' }
                            ]}>{p_option}</Text>
                        </TouchableOpacity>
                )
            }
        </View>
        <View style={[styles.cancelContainer, themeStyles.modalBackgroundColor]}>

            <TouchableOpacity
                style={[styles.optionButton]}
                onPress={close}
            >
                <Text style={[styles.optionText, themeStyles.fontColorMain]}>Cancel</Text>
            </TouchableOpacity>

        </View>
    </Modal >;
}
const styles = StyleSheet.create(
    {
        container: {
            marginLeft: 15,
            marginRight: 15
        },
        optionsContainer: {
            marginTop: 'auto',
            borderRadius: 15,
        },
        optionButton: {
            height: 54,
            alignItems: 'center',
            justifyContent: 'center'
        },
        cancelContainer: {
            marginTop: 10,
            borderRadius: 15,
            marginBottom: Platform.OS === 'ios' ? 10 : 0
        },
        optionText: {
            fontSize: 16,
            fontWeight: '500'
        },
        headerDescription: {
            textAlign: 'center',
            paddingLeft: '10%',
            paddingRight: '10%',
            paddingTop: 15,
            paddingBottom: 10
        }
    }
);
