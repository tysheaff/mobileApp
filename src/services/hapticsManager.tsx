import { constants } from '@globals/constants';
import { globals } from '@globals/globals';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class HapticsManager {

    constructor() { }

    public async init() {
        const hapticsKey = `${globals.user.publicKey}${constants.localStorage_cloutFeedHapticsEnabled}`;
        const areHapticsEnabledString = await SecureStore.getItemAsync(hapticsKey).catch(() => undefined);
        globals.hapticsEnabled = !areHapticsEnabledString || areHapticsEnabledString === 'true';
    }

    public lightImpact() {
        if (!globals.hapticsEnabled) {
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    public customizedImpact() {
        if (!globals.hapticsEnabled) {
            return;
        }

        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }
}
