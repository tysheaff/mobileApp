import { globals } from '../globals/globals';
import { api } from './api/api';
import { formatNumber } from './helpers';

export async function loadTickersAndExchangeRate() {
    await api.getExchangeRate()
        .then(
            p_response => {
                globals.exchangeRate = p_response;
            }
        ).catch(p_error => globals.defaultHandleError(p_error));
    return true;
}

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

export function calculateAndFormatBitCloutInUsd(p_nanos: number) {
    return formatNumber(calculateBitCloutInUSD(p_nanos));
}
