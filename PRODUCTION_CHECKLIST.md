# FlexCoach Admin App - Production Deployment Checklist

## 🚀 Before Production Deployment

### 1. Environment Configuration
- [ ] Update `app/config/environment.js` - PRODUCTION_CONFIG section:
  - [ ] Change `API_BASE_URL` from `https://your-production-api.com` to your actual production API URL
  - [ ] Verify `API_TIMEOUT` is appropriate (currently 30 seconds)
  - [ ] Confirm logging is disabled (`ENABLE_API_LOGGING: false`)
  - [ ] Confirm debug logs are disabled (`ENABLE_DEBUG_LOGS: false`)
  - [ ] Set appropriate security timeouts

### 2. Backend Configuration
- [ ] Deploy backend server to production environment
- [ ] Update backend `config.js` with production database URL
- [ ] Set production JWT secret (different from development)
- [ ] Configure production CORS settings
- [ ] Set up SSL/HTTPS for backend API
- [ ] Test backend health endpoint: `https://your-api.com/health`

### 3. Security
- [ ] Generate strong JWT secret for production
- [ ] Set up proper HTTPS certificates
- [ ] Configure secure headers
- [ ] Review and test authentication flows
- [ ] Test token expiration and refresh

### 4. Database
- [ ] Set up production MongoDB database
- [ ] Create admin user in production database
- [ ] Test database connectivity
- [ ] Set up database backups
- [ ] Configure database security (authentication, IP whitelist)

### 5. Testing
- [ ] Test login functionality
- [ ] Test all API endpoints
- [ ] Test on both iOS and Android devices
- [ ] Test network error handling
- [ ] Test offline behavior
- [ ] Performance testing with real data

### 6. App Store Preparation
- [ ] Update app version in `app.json`
- [ ] Update app name and description
- [ ] Prepare app icons and screenshots
- [ ] Test app signing and building
- [ ] Create app store listings

## 📝 Configuration Files to Update

### 1. `app/config/environment.js`
```javascript
// Update PRODUCTION_CONFIG section:
API_BASE_URL: 'https://your-actual-production-api.com',
```

### 2. `backend/config.js`
```javascript
// Update production values:
MONGODB_URI: 'your-production-mongodb-connection-string',
JWT_SECRET: 'your-strong-production-jwt-secret',
NODE_ENV: 'production'
```

### 3. `app.json` or `app.config.js`
```json
{
  "expo": {
    "name": "FlexCoach Admin",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"]
  }
}
```

## 🔧 Development vs Production Differences

| Feature | Development | Production |
|---------|-------------|------------|
| API URL | `http://10.231.45.234:3001` | `https://your-api.com` |
| Logging | Enabled | Disabled |
| Debug Tools | Enabled | Disabled |
| Token Expiry | 24 hours | 8 hours |
| Auto Logout | 60 minutes | 30 minutes |
| HTTPS | Not required | Required |
| Error Details | Full details | Limited details |

## 🚨 Security Checklist

- [ ] All API calls use HTTPS
- [ ] JWT tokens are stored securely (using SecureStore)
- [ ] No sensitive data in logs
- [ ] Proper error handling (no sensitive info exposed)
- [ ] Rate limiting configured on backend
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Database access secured

## 📱 App Store Deployment

### iOS (App Store)
- [ ] Apple Developer Account set up
- [ ] App Store Connect configured
- [ ] iOS certificates and provisioning profiles
- [ ] Build and upload to TestFlight
- [ ] Submit for App Store review

### Android (Google Play)
- [ ] Google Play Console account
- [ ] Android signing key generated
- [ ] Build AAB (Android App Bundle)
- [ ] Upload to Google Play Console
- [ ] Submit for review

## 🔍 Post-Deployment Testing

- [ ] Test login with production API
- [ ] Verify all features work with production data
- [ ] Test on multiple devices
- [ ] Monitor error logs
- [ ] Test performance under load
- [ ] Verify security measures

## 📞 Support Information

- Backend API Health Check: `https://your-api.com/health`
- Admin Login Endpoint: `https://your-api.com/api/admin/login`
- Database: Production MongoDB instance
- Monitoring: Set up error tracking and analytics

---

**Note**: This checklist should be completed before any production deployment. Keep this file updated as the application evolves.