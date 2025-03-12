const {json_converter} = require('@camueller/json-converter');
const {format, addHours} = require('date-fns');
const {TZDate} = require('@date-fns/tz');
const fs = require('node:fs');

function powerPostProcessor(value, arrayIndex, arrayAllElements) {
    if(arrayIndex == 0) {
        // if first value is a full hour value, then there is no half hour value to calculate average from
        return value;
    }
    const previousElement = arrayAllElements[arrayIndex - 1];
    const previousElementPower = previousElement['pv_estimate'];
    // FIXME use pvForecastFactor = 0.33 from env
    return 0.33 * (value + previousElementPower) / 2;
}

function dayHourProcessor(value) {
    const date = new Date(value);
    const zonedDate = new TZDate(date, process.env.TZ ?? 'Europe/Berlin');
    const periodStartDate = addHours(zonedDate, -1); // period_start = period_end - 1
    return format(periodStartDate, 'yyyy-MM-dd\'T\'HH');
}

describe('solcast.com', () => {
    test('converts solar forecast provided by solcast.com', () => {
        const data = fs.readFileSync('test/solcast.json', 'utf8');
        expect(json_converter(data, {
            '$on': 'forecasts',
            '$filter': ['period_end', (value) => value.startsWith('2024-11-04') && value.match(/.*T..:00.*/)],
            'period_start': ['period_end', (value) => dayHourProcessor(value)],
            'power': ['pv_estimate', (value, arrayIndex, arrayAllElements) => powerPostProcessor(value, arrayIndex, arrayAllElements)],
            '$arrayToObject': ['period_start', 'power']
        })).toStrictEqual({
            "2024-11-04T00": 0,
            "2024-11-04T01": 0,
            "2024-11-04T02": 0,
            "2024-11-04T03": 0,
            "2024-11-04T04": 0,
            "2024-11-04T05": 0,
            "2024-11-04T06": 0,
            "2024-11-04T07": 0.0349305,
            "2024-11-04T08": 0.47896200000000005,
            "2024-11-04T09": 1.0176375000000002,
            "2024-11-04T10": 1.4457135,
            "2024-11-04T11": 1.784409,
            "2024-11-04T12": 1.8632790000000001,
            "2024-11-04T13": 1.6970415,
            "2024-11-04T14": 1.3277385000000002,
            "2024-11-04T15": 0.8548484999999999,
            "2024-11-04T16": 0.2336895,
            "2024-11-04T17": 0,
            "2024-11-04T18": 0,
            "2024-11-04T19": 0,
            "2024-11-04T20": 0,
            "2024-11-04T21": 0,
            "2024-11-04T22": 0,
            "2024-11-04T23": 0
        });
    });
});
