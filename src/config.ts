/**
 * Application configuration
 */
const config = {
    apiUrl: '/api', // Relative path for same-origin requests
    auth: {
      tokenKey: 'lms_auth_token',
      userKey: 'lms_user'
    },
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50]
    }
  };
  
  export default config;