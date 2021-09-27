import { Profile } from '@types';

export function calculateDurationUntilNow(p_timeStampNanoSeconds: number): string {
    const milliseconds = p_timeStampNanoSeconds / 1000000;
    const durationUntilNowInMilliseconds = new Date().getTime() - milliseconds;
    const durationInMinutes = durationUntilNowInMilliseconds / 1000 / 60;

    if (durationInMinutes < 60) {
        return Math.floor(durationInMinutes) + 'm';
    }

    const durationInHours = durationInMinutes / 60;

    if (durationInHours < 24) {
        return Math.floor(durationInHours) + 'h';
    }

    const durationInDays = durationInHours / 24;

    return Math.floor(durationInDays) + 'd';
}

export function getAnonymousProfile(p_publicKey: string) {
    const profile = {
        Username: 'anonymous',
        PublicKeyBase58Check: p_publicKey,
        Description: '',
        ProfilePic: 'https://i.imgur.com/vZ2mB1W.png',
        CoinPriceBitCloutNanos: 0,
    } as Profile;

    return profile;
}

export function checkProfilePicture(p_profile: Profile) {
    if (p_profile.ProfilePic === '/assets/img/default_profile_pic.png') {
        p_profile.ProfilePic = 'https://i.imgur.com/vZ2mB1W.png';
    }
}

const SYMBOLS = ['', 'k', 'M', 'G', 'T', 'P', 'E'];

// If > 1000 and usingSuffix is true: 8234.79 => 8.2k and 12345678.91 => 12.3M
// If < 1000 or usingSuffix is false: 82.7934 => 82.79 and 8234.7934 => 8,234.79
export function formatNumber(p_number: number, p_decimalPlaces = 2, usingSuffix = true, numSuffixDecimals = 1): string {
    const tier = Math.log10(Math.abs(p_number)) / 3 | 0;

    if (tier <= 0 || !usingSuffix) {
        const numberRoundedWithDecimals = Math.floor(p_number * Math.pow(10, p_decimalPlaces)) / Math.pow(10, p_decimalPlaces);
        return numberRoundedWithDecimals.toLocaleString(undefined, {
            minimumFractionDigits: p_decimalPlaces,
            maximumFractionDigits: p_decimalPlaces
        });
    }

    const suffix = SYMBOLS[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = p_number / scale;
    return scaled.toFixed(numSuffixDecimals) + suffix;
}

// No suffix, always 2 decimal places, for when full precision is desired
export function formatAsFullCurrency(p_number: number): string {
    return formatNumber(p_number, 2, false);
}

export function isNumber(p_value: any): boolean {
    return !isNaN(p_value) &&
        !isNaN(parseFloat(p_value));
}
