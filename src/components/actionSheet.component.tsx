import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ActionSheetConfig } from '@services';
import { themeStyles } from '@styles';
import Modal from 'react-native-modal'
import { eventManager } from '@globals/injector';
import { EventType } from "@types";

export function ActionSheet(props: { config: ActionSheetConfig }) {

    let _isMounted = true;

    useEffect(() => {
        return () => { _isMounted = false };
    }, [])

    function onOptionClick(p_optionIndex: number) {
        props.config?.callback(p_optionIndex);
        close();
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
        animationInTiming={500}
        onSwipeComplete={close}
        onBackdropPress={close}
        onBackButtonPress={close}
        isVisible={true}
        style={styles.container}>
        <View style={[styles.optionsContainer, themeStyles.actionSheetContainer]}>
            {
                props.config.options.map(
                    (p_option: string, p_index: number) =>
                        p_index !== props.config.options.length - 1 &&
                        <TouchableOpacity
                            style={[styles.optionButton, themeStyles.recloutBorderColor]}
                            key={p_index.toString()}
                            onPress={() => onOptionClick(p_index)}
                        >
                            <Text style={[themeStyles.fontColorMain, props.config.destructiveButtonIndex.includes(p_index) && { color: '#ff0000' }]}>{p_option}</Text>
                        </TouchableOpacity>
                )
            }
        </View>
        <View style={[styles.cancelContainer, themeStyles.actionSheetContainer, styles.cancel]}>

            <TouchableOpacity
                style={[styles.optionButton, themeStyles.recloutBorderColor]}
                onPress={close}
            >
                <Text style={[themeStyles.fontColorMain]}>Cancel</Text>
            </TouchableOpacity>

        </View>
    </Modal>
}
const styles = StyleSheet.create(
    {
        container: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            margin: 0,
        },
        optionsContainer: {
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            margin: 15,
            borderRadius: 15,
        },
        optionButton: {
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            margin: 15,
            borderRadius: 15,
        },
        cancel: {
        }
    }
);
