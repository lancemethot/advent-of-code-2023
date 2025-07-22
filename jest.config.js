module.exports = {
  preset: 'ts-jest',
  reporters: ["default"],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    "<rootDir>/dist/",
    "__tests__/util",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/dist/",
    "__tests__/util"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/dist/"
  ],
};
