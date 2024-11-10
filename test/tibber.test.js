const {json_converter} = require('@camueller/json-converter');
const {format} = require('date-fns');
const fs = require('node:fs');

function convertDate(input) {
    const parsedDate = Date.parse(input);
    return format(parsedDate, 'yyyy-MM-dd\'T\'HH');
}

describe('tibber', () => {
    test('converts energy prices provided by tibber', () => {
        const data = fs.readFileSync('test/tibber.json', 'utf8');
        expect(json_converter(data, {
            '$on': '$..priceInfo.today',
            'total': ['total'],
            'startsAt': ['startsAt', (value) => convertDate(value)],
            '$arrayToObject': ['startsAt', 'total']
        })).toStrictEqual({
            "2024-11-04T00": 0.2951,
            "2024-11-04T01": 0.2926,
            "2024-11-04T02": 0.2927,
            "2024-11-04T03": 0.2925,
            "2024-11-04T04": 0.2936,
            "2024-11-04T05": 0.3028,
            "2024-11-04T06": 0.3342,
            "2024-11-04T07": 0.358,
            "2024-11-04T08": 0.3512,
            "2024-11-04T09": 0.3291,
            "2024-11-04T10": 0.3045,
            "2024-11-04T11": 0.3011,
            "2024-11-04T12": 0.2988,
            "2024-11-04T13": 0.3027,
            "2024-11-04T14": 0.3083,
            "2024-11-04T15": 0.3407,
            "2024-11-04T16": 0.4015,
            "2024-11-04T17": 0.5309,
            "2024-11-04T18": 0.4724,
            "2024-11-04T19": 0.3784,
            "2024-11-04T20": 0.3319,
            "2024-11-04T21": 0.3191,
            "2024-11-04T22": 0.314,
            "2024-11-04T23": 0.3017
        });
    });
});
