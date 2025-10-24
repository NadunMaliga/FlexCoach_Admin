# Implementation Plan

- [x] 1. Set up admin backend to match existing frontend expectations





  - Update existing admin backend to use shared database (mongodb://localhost:27017/flexcoach_dev)
  - Ensure admin backend runs on port 3001 (different from client backend on port 3000)
  - Update CORS configuration to allow admin mobile app connections
  - Add compression middleware for mobile data optimization
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 2. Implement admin authentication API that frontend expects





- [x] 2.1 Create admin login endpoint for mobile app


  - Implement POST /api/admin/login endpoint matching frontend expectations
  - Add JWT token generation for admin authentication
  - Support email/password authentication (admin@flexcoach.com / admin123)
  - Return admin profile data and token as expected by AdminLogin.tsx
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 2.2 Add admin profile and session management


  - Implement GET /api/admin/profile endpoint for admin details
  - Add admin session validation middleware
  - Create admin logout functionality
  - Add token refresh mechanism for mobile app
  - _Requirements: 1.3, 1.4, 6.1, 6.2, 6.3_

- [x] 3. Implement user management API that AdminPanel.tsx expects





- [x] 3.1 Create GET /api/admin/users endpoint for user list


  - Implement endpoint that returns all users with status, dates, and details
  - Return user data in format expected by AdminPanel.tsx (User interface)
  - Add proper error handling and success responses
  - Include user status (pending, approved, rejected) and creation dates
  - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [x] 3.2 Implement user approval endpoint POST /api/admin/users/:userId/approve

  - Create endpoint that matches frontend expectation for user approval
  - Update user status to 'approved' and set approvedBy and approvedAt fields
  - Return success response format expected by frontend
  - Add proper error handling for non-existent users and invalid states
  - _Requirements: 2.3, 2.4_

- [x] 4. Implement user rejection endpoint POST /api/admin/users/:userId/reject





- [x] 4.1 Create user rejection endpoint with reason support


  - Implement endpoint that updates user status to 'rejected'
  - Add support for rejection reason (rejectedReason field)
  - Return proper success/error responses expected by frontend
  - Update user with rejectedBy and rejectedAt timestamps
  - _Requirements: 2.3, 2.4_

- [x] 4.2 Add authentication middleware for admin endpoints


  - Create middleware to validate admin JWT tokens
  - Protect all admin endpoints with authentication
  - Add proper error responses for unauthorized access
  - Support the Authorization Bearer token format expected by frontend
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Enhance existing admin backend server configuration







- [x] 5.1 Update admin backend to use shared database




  - Modify backend/config.js to use same MongoDB URI as client backend
  - Ensure admin backend connects to mongodb://localhost:27017/flexcoach
  - Update server.js to use shared User and Admin models
  - Test database connection and model access
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 5.2 Add mobile-optimized response formatting


  - Add response compression middleware for mobile data efficiency
  - Implement consistent JSON response format expected by frontend
  - Add proper HTTP status codes and error messages
  - Optimize response payload sizes for mobile consumption
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Test and validate admin API endpoints with frontend





- [x] 6.1 Test admin login flow with AdminLogin.tsx


  - Verify POST /api/admin/login works with hardcoded credentials
  - Test JWT token generation and response format
  - Ensure error handling matches frontend expectations
  - Validate authentication flow end-to-end
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 6.2 Test user management flow with AdminPanel.tsx


  - Verify GET /api/admin/users returns data in expected format
  - Test user approval and rejection endpoints
  - Validate refresh functionality and real-time updates
  - Ensure loading states and error handling work correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Add enhanced features for better admin experience





- [x] 7.1 Implement dashboard statistics endpoint


  - Create GET /api/admin/dashboard/stats for admin panel metrics
  - Include total users, pending approvals, recent registrations
  - Add user status breakdown (approved, rejected, pending counts)
  - Return data in mobile-friendly format for dashboard widgets
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 7.2 Add user filtering and search capabilities


  - Enhance GET /api/admin/users with status filtering (pending, approved, rejected)
  - Add search functionality by name, email, or other user fields
  - Implement pagination for large user lists
  - Add sorting options by registration date, status, etc.
  - _Requirements: 2.5, 2.6, 4.1, 5.1_

- [ ] 8. Add audit logging for admin actions






- [x] 8.1 Create audit logging system


  - Log all admin login attempts and successful logins
  - Track user approval and rejection actions with timestamps
  - Record admin ID, action type, target user, and IP address
  - Store audit logs in database for future reference
  - _Requirements: 4.1, 6.1_

- [x] 8.2 Implement audit log retrieval










  - Create GET /api/admin/audit-logs endpoint for viewing admin actions
  - Add filtering by admin, action type, date range
  - Include pagination for large audit log datasets
  - Return audit data in mobile-friendly format
  - _Requirements: 4.1, 6.1_

- [x] 9. Add bulk operations for efficient user management





- [x] 9.1 Implement bulk user approval functionality





  - Create POST /api/admin/users/bulk-approve endpoint
  - Accept array of user IDs for bulk approval
  - Update multiple users' status to approved in single operation
  - Return success/failure count and any errors
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 9.2 Add bulk user rejection functionality

  - Create POST /api/admin/users/bulk-reject endpoint
  - Support bulk rejection with common rejection reason
  - Update multiple users' status and rejection reason
  - Include proper error handling and rollback on failures
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 10. Add data export functionality for admin reports



- [ ] 10.1 Implement user data export to CSV
  - Create GET /api/admin/users/export endpoint
  - Generate CSV file with user data and status information
  - Support filtering by status, date range, and other criteria
  - Return downloadable file or email link for mobile sharing
  - _Requirements: 2.1, 2.5, 4.1_

- [ ] 10.2 Add user statistics and analytics export
  - Create export functionality for user registration trends
  - Generate reports on approval rates and processing times
  - Include demographic breakdowns and training mode preferences
  - Support multiple export formats (CSV, JSON) for different use cases
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Implement comprehensive error handling and validation










- [x] 11.1 Add input validation for all admin endpoints


  - Validate admin login credentials and format
  - Add validation for user ID parameters in approve/reject endpoints
  - Implement request body validation for bulk operations
  - Return consistent error messages expected by frontend
  - _Requirements: 1.1, 2.3, 2.4, 5.3, 5.4, 5.5_

- [x] 11.2 Create centralized error handling middleware




  - Implement consistent error response format across all endpoints
  - Add proper HTTP status codes (400, 401, 403, 404, 500)
  - Log errors with request details for debugging
  - Handle database connection errors gracefully
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 12. Add security enhancements for admin backend





- [x] 12.1 Implement rate limiting for admin endpoints


  - Add rate limiting middleware to prevent brute force attacks
  - Configure different limits for login vs. other admin operations
  - Return proper error messages when rate limits are exceeded
  - Log rate limit violations for security monitoring
  - _Requirements: 1.1, 1.2, 5.3, 5.4_

- [x] 12.2 Add CORS and security headers


  - Configure CORS to allow admin mobile app connections
  - Add security headers (helmet.js) for production deployment
  - Implement proper JWT token validation and expiration
  - Add request logging for security audit trails
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.1, 5.2_