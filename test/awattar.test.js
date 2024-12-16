const {json_converter} = require('@camueller/json-converter');
const {format} = require('date-fns');
const fs = require('node:fs');

function convertDate(input) {
    const parsedDate = new Date(input);
    return format(parsedDate, 'yyyy-MM-dd\'T\'HH');
}

function convertToCentPerkWh(input) {
    return Number((input / 1000).toFixed(4));
}

describe('awattar', () => {
    test('converts energy prices provided by awattar', () => {
        const data = fs.readFileSync('test/awattar.json', 'utf8');
        expect(json_converter(data, {
            '$on': 'data',
            'EuroPerkWh': ['marketprice', (value) => convertToCentPerkWh(value)],
            'startsAt': ['start_timestamp', (value) => convertDate(value)],
            '$arrayToObject': ['startsAt', 'EuroPerkWh']
        })).toStrictEqual({
            "2024-12-16T00": 0.0815,
            "2024-12-16T01": 0.0756,
            "2024-12-16T02": 0.0468,
            "2024-12-16T03": 0.0567,
            "2024-12-16T04": 0.0603,
            "2024-12-16T05": 0.0846,
            "2024-12-16T06": 0.1229,
            "2024-12-16T07": 0.1359,
            "2024-12-16T08": 0.1362,
            "2024-12-16T09": 0.1230,
            "2024-12-16T10": 0.1099,
            "2024-12-16T11": 0.0950,
            "2024-12-16T12": 0.0972,
            "2024-12-16T13": 0.1027,
            "2024-12-16T14": 0.1114,
            "2024-12-16T15": 0.1223,
            "2024-12-16T16": 0.1312,
            "2024-12-16T17": 0.1350,
            "2024-12-16T18": 0.1351,
            "2024-12-16T19": 0.1331,
            "2024-12-16T20": 0.1275,
            "2024-12-16T21": 0.1200,
            "2024-12-16T22": 0.1057,
            "2024-12-16T23": 0.0939
        });
    });
});
