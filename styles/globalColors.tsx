import { StyleSheet } from 'react-native';
import { settingsGlobals } from '@globals';

export let themeStyles = StyleSheet.create(
    {
        fontColorMain: { color: settingsGlobals.darkMode ? '#ebebeb' : 'black' },
        switchColor: { color: settingsGlobals.darkMode ? 'rgba(128, 128, 128, 1)' : 'rgba(128, 128, 128, 0.4)' },
        fontColorSub: { color: settingsGlobals.darkMode ? '#b0b3b8' : '#828282' },
        containerColorMain: { backgroundColor: settingsGlobals.darkMode ? '#000000' : 'white' },
        containerColorSub: { backgroundColor: settingsGlobals.darkMode ? '#121212' : '#f7f7f7' },
        chipColor: { backgroundColor: settingsGlobals.darkMode ? '#262525' : '#f5f5f5' },
        coinPriceContainer: { backgroundColor: settingsGlobals.darkMode ? '#171717' : '#ebebeb' },
        borderColor: { borderColor: settingsGlobals.darkMode ? '#262626' : '#e0e0e0' },
        lightBorderColor: { borderColor: settingsGlobals.darkMode ? '#1a1a1a' : '#f2f2f2' },
        buttonBorderColor: { borderColor: settingsGlobals.darkMode ? '#262626' : 'black' },
        shadowColor: { shadowColor: settingsGlobals.darkMode ? 'black' : '#d6d6d6' },
        recloutBorderColor: { borderColor: settingsGlobals.darkMode ? '#4a4a4a' : '#bdbdbd' },
        buttonDisabledColor: { backgroundColor: settingsGlobals.darkMode ? '#2e2e2e' : '#999999' },
        diamondColor: { color: settingsGlobals.darkMode ? '#b9f2ff' : '#3599d4' },
        linkColor: { color: settingsGlobals.darkMode ? '#d1eeff' : '#3f729b' },
        modalBackgroundColor: { backgroundColor: settingsGlobals.darkMode ? '#242424' : '#f7f7f7' },
        disabledButton: { backgroundColor: '#2b2b2b' },
        likeHeartBackgroundColor: { backgroundColor: '#eb1b0c' },
        verificationBadgeBackgroundColor: { backgroundColor: '#007ef5' },
        currencyButtonBackgroundColor: { backgroundColor: settingsGlobals.darkMode ? '#626262' : '#e1e1e1' },
        peekOptionsContainer: { backgroundColor: settingsGlobals.darkMode ? '#323232' : '#F0F0F0' },
        peekOptionsBorder: { borderColor: settingsGlobals.darkMode ? '#4c4c4c' : '#cccccc' }
    }
);

export function updateThemeStyles() {
    themeStyles = StyleSheet.create(
        {
            fontColorMain: { color: settingsGlobals.darkMode ? '#ebebeb' : 'black' },
            fontColorSub: { color: settingsGlobals.darkMode ? '#b0b3b8' : '#828282' },
            containerColorMain: { backgroundColor: settingsGlobals.darkMode ? '#000000' : 'white' },
            switchColor: { color: settingsGlobals.darkMode ? 'rgba(128, 128, 128, 1)' : 'rgba(128, 128, 128, 0.4)' },
            containerColorSub: { backgroundColor: settingsGlobals.darkMode ? '#121212' : '#f7f7f7' },
            chipColor: { backgroundColor: settingsGlobals.darkMode ? '#262525' : '#f5f5f5' },
            coinPriceContainer: { backgroundColor: settingsGlobals.darkMode ? '#171717' : '#ebebeb' },
            borderColor: { borderColor: settingsGlobals.darkMode ? '#262626' : '#e0e0e0' },
            lightBorderColor: { borderColor: settingsGlobals.darkMode ? '#1a1a1a' : '#f2f2f2' },
            buttonBorderColor: { borderColor: settingsGlobals.darkMode ? '#262626' : 'black' },
            shadowColor: { shadowColor: settingsGlobals.darkMode ? 'black' : '#d6d6d6' },
            recloutBorderColor: { borderColor: settingsGlobals.darkMode ? '#4a4a4a' : '#bdbdbd' },
            buttonDisabledColor: { backgroundColor: settingsGlobals.darkMode ? '#2e2e2e' : '#999999' },
            diamondColor: { color: settingsGlobals.darkMode ? '#b9f2ff' : '#3599d4' },
            linkColor: { color: settingsGlobals.darkMode ? '#d1eeff' : '#3f729b' },
            modalBackgroundColor: { backgroundColor: settingsGlobals.darkMode ? '#242424' : '#f7f7f7' },
            disabledButton: { backgroundColor: '#2b2b2b' },
            likeHeartBackgroundColor: { backgroundColor: '#eb1b0c' },
            verificationBadgeBackgroundColor: { backgroundColor: '#007ef5' },
            currencyButtonBackgroundColor: { backgroundColor: settingsGlobals.darkMode ? '#626262' : '#e1e1e1' },
            peekOptionsContainer: { backgroundColor: settingsGlobals.darkMode ? '#323232' : '#F0F0F0' },
            peekOptionsBorder: { borderColor: settingsGlobals.darkMode ? '#4c4c4c' : '#cccccc' }

        }
    );
}
