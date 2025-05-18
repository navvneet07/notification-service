module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/test/**/*.test.js'],

  // Setup file to run before tests
  setupFilesAfterEnv: ['./test/setup.js'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/'],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'clover'],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules'],

  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {},

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/'],



  // An array of regexp pattern strings that are matched against all source file paths
  transformIgnorePatterns: ['/node_modules/'],

  // Indicates whether each individual test should be reported during the run
  verbose: true
};
