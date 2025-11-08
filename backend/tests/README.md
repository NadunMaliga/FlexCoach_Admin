# FlexCoach Admin Backend Tests

This directory contains test files for the FlexCoach Admin backend.

## Test Files

These files were moved from the backend root directory for better organization.

### Running Tests

Most of these are integration tests that test the API endpoints directly.

To run a test:
```bash
node tests/test-api-endpoints.js
```

### Test Categories

- **API Tests**: `test-api-*.js` - Test API endpoints
- **Diet Tests**: `test-diet-*.js`, `test-addiet-*.js` - Test diet plan functionality
- **Workout Tests**: `test-workout-*.js` - Test workout schedule functionality
- **Food Tests**: `test-foods-*.js` - Test food database functionality
- **Dashboard Tests**: `test-dashboard-*.js` - Test dashboard endpoints
- **User Tests**: `test-user-*.js` - Test user-related functionality
- **Photo Tests**: `test-photos-*.js` - Test photo upload/retrieval
- **Measurement Tests**: `test-measurement-*.js` - Test body measurement functionality

### Notes

- These tests use hardcoded `http://localhost:3001` URLs
- Make sure the backend server is running before executing tests
- Some tests require specific test data in the database

### TODO

- [ ] Convert to proper test framework (Jest, Mocha, etc.)
- [ ] Add test configuration file
- [ ] Implement test database seeding
- [ ] Add CI/CD integration
