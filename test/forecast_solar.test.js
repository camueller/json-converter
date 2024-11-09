const {json_converter} = require('@camueller/json-converter');
const {parse, format} = require('date-fns');
const fs = require('node:fs');

function convertDate(input) {
    const parsedDate = parse(input, 'yyyy-MM-dd HH:mm:ss', new Date());
    const formattedDate = format(parsedDate, 'yyyy-MM-dd\'T\'HH');
    return formattedDate.startsWith('2024-10-23') ? formattedDate : undefined;
}

describe('forecast.solar', () => {
    test('converts solar forecast provided by forcast.solar', () => {
        const data = fs.readFileSync('test/forecast-solar.json', 'utf8');
        expect(json_converter(data, {
            '$on': '$.result.watt_hours_period',
            '$any': {key: (value) => convertDate(value)}
        })).toStrictEqual({
            '2024-10-23T08': 0,
            '2024-10-23T09': 786,
            '2024-10-23T10': 2241,
            '2024-10-23T11': 3479,
            '2024-10-23T12': 4284,
            '2024-10-23T13': 4387,
            '2024-10-23T14': 4025,
            '2024-10-23T15': 3558,
            '2024-10-23T16': 2875,
            '2024-10-23T17': 1841,
            '2024-10-23T18': 79
        });
    });
});
