module.exports = {
  preset: 'ts-jest',
  reporters: ["default"],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    "__tests__/util",
  ],
  testPathIgnorePatterns: [
    "__tests__/util"
  ],
};
