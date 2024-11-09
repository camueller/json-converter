module.exports = {
    testEnvironment: 'node',
    // for IDE testing enable the following line
    // modulePaths: ['<rootDir>/src/'],
    // ... and change imports in tests as follows
    // const {json_converter} = require('index');
    // ... and remove "export" on main function
    // function json_converter(json, mapping, on) {
    moduleNameMapper: {
        "^@camueller/(.*)$": "<rootDir>/dist/$1.cjs.js"
    }
};
