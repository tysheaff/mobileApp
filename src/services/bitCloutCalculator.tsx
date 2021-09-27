import { globals } from '../globals/globals';
import { formatNumber } from './helpers';

export function calculateBitCloutInUSD(p_nanos: number) {
    if (globals.exchangeRate) {
        const dollarPerBitClout = globals.exchangeRate.USDCentsPerBitCloutExchangeRate / 100;
        const dollarPerNano = dollarPerBitClout / 1000000000;
        let result = dollarPerNano * p_nanos;
        result = Math.round((result + Number.EPSILON) * 100) / 100;
        return result;
    }

    return 0;
}

// If usingSuffix is true, it'll be like `1.2k`, otherwise it'll be full precision like `1,234.56`
export function calculateAndFormatBitCloutInUsd(p_nanos: number, usingSuffix = true): string {
    return formatNumber(calculateBitCloutInUSD(p_nanos), 2, usingSuffix);
}
