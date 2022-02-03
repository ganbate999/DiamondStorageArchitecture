export function getTimestamp(date: Date){
    return Math.floor(date.getTime()/1000);
}

export const BEFORE_ONE_HOUR_TIMESTAMP = getTimestamp(new Date()) - 3600;
export const TIMESTAMP_NOW = getTimestamp(new Date());
export const AFTER_ONE_HOUR_TIMESTAMP = getTimestamp(new Date()) + 3600;
export const AFTER_ONE_DAY_TIMESTAMP = getTimestamp(new Date()) + 3600 * 24;

export const FUNDING_COIN_SUPPLY = 20000;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';


