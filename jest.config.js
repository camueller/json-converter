module.exports = {
    testEnvironment: 'node',
    moduleNameMapper: {
        "^@camueller/(.*)$": "<rootDir>/dist/$1.cjs.js"
    }
};
