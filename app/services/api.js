
import * as SecureStore from 'expo-secure-store';

// Simple environment configuration
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const BASE_URL = isDev
  ? 'http://10.61.200.234:3001'  // Development
  : 'https://your-production-api.com'; // Production - UPDATE THIS

const API_BASE = `${BASE_URL}/api/admin`;
const API_TIMEOUT = isDev ? 10000 : 30000;
const ENABLE_LOGGING = isDev;

class ApiService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  async loadToken() {
    try {
      this.token = await SecureStore.getItemAsync('adminToken');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  async setToken(token) {
    this.token = token;
    try {
      await SecureStore.setItemAsync('adminToken', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async removeToken() {
    this.token = null;
    try {
      await SecureStore.deleteItemAsync('adminToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }



  async request(endpoint, options = {}) {
    // Ensure token is loaded before making request
    if (!this.token) {
      await this.loadToken();
    }

    const url = `${API_BASE}${endpoint}`;

    // Only set Content-Type header if there's a body
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      if (ENABLE_LOGGING) {
        console.log(`🔑 Adding auth header with token: ${this.token.substring(0, 20)}...`);
      }
    } else {
      if (ENABLE_LOGGING) {
        console.log(`⚠️ No token available for request`);
      }
    }

    // Only add Content-Type for requests with body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const requestConfig = {
      headers,
      timeout: API_TIMEOUT,
      ...options,
    };

    try {
      if (ENABLE_LOGGING) {
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
        console.log(`🔑 Token present: ${!!this.token}`);
      }

      const response = await fetch(url, requestConfig);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (ENABLE_LOGGING) {
        console.log(`✅ API Success: ${endpoint}`);
      }

      return data;
    } catch (error) {
      if (ENABLE_LOGGING) {
        console.error(`❌ API Failed: ${endpoint}`, error);
        console.error(`Full URL: ${url}`);
      }
      throw error;
    }
  }

  // Test connection to backend
  async testConnection() {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      console.log('Backend connection test:', data);
      return response.ok;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // Authentication
  async login(password, email = 'admin@gmail.com') {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      await this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.removeToken();
    }
  }

  async getProfile() {
    return this.request('/profile');
  }

  // Users
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  async approveUser(userId) {
    return this.request(`/users/${userId}/approve`, { method: 'POST' });
  }

  async rejectUser(userId, reason) {
    return this.request(`/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateUserStatus(userId, isActive) {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getClientOverview(period = '7') {
    return this.request(`/dashboard/client-overview?period=${period}`);
  }

  async getRecentActivity(limit = 10) {
    return this.request(`/dashboard/recent-activity?limit=${limit}`);
  }

  // Exercises
  async getExercises(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/exercises${queryString ? `?${queryString}` : ''}`);
  }

  async getExerciseById(id) {
    return this.request(`/exercises/${id}`);
  }

  async createExercise(exerciseData) {
    return this.request('/exercises', {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
  }

  async updateExercise(id, exerciseData) {
    return this.request(`/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exerciseData),
    });
  }

  async deleteExercise(id) {
    return this.request(`/exercises/${id}`, { method: 'DELETE' });
  }

  // Foods
  async getFoods(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/foods${queryString ? `?${queryString}` : ''}`);
  }

  async getFoodById(id) {
    return this.request(`/foods/${id}`);
  }

  async createFood(foodData) {
    return this.request('/foods', {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  }

  async updateFood(id, foodData) {
    return this.request(`/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(foodData),
    });
  }

  async deleteFood(id) {
    return this.request(`/foods/${id}`, { method: 'DELETE' });
  }

  // Diet Plans
  async getDietPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/diet-plans${queryString ? `?${queryString}` : ''}`);
  }

  async getUserDietPlans(userId) {
    // Use non-admin route for fetching user diet plans
    const response = await fetch(`${BASE_URL}/api/diet-plans/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getDietPlanById(id) {
    return this.request(`/diet-plans/${id}`);
  }

  async createDietPlan(dietPlanData) {
    // Use non-admin route for diet plan creation
    const response = await fetch(`${BASE_URL}/api/diet-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dietPlanData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async updateDietPlan(id, dietPlanData) {
    console.log('Updating diet plan:', id, dietPlanData);

    // Use non-admin route for diet plan updates
    const response = await fetch(`${BASE_URL}/api/diet-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dietPlanData),
    });

    const data = await response.json();
    return data;
  }

  async deleteDietPlan(id) {
    console.log('Deleting diet plan:', id);

    // Use non-admin route for diet plan deletion
    const response = await fetch(`${BASE_URL}/api/diet-plans/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  }

  // Diet History API methods
  async getDietHistory(userId, options = {}) {
    const {
      startDate,
      endDate,
      limit = 50,
      page = 1,
      groupBy = 'date'
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      groupBy
    });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/api/diet-history/user/${userId}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getDietHistoryStats(userId, period = '30') {
    const response = await fetch(`${BASE_URL}/api/diet-history/stats/${userId}?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async deleteDietFromHistory(planId, userId) {
    const response = await fetch(`${BASE_URL}/api/diet-history/${planId}?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Workout Schedules
  async getWorkoutSchedules(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/workout-schedules${queryString ? `?${queryString}` : ''}`);
  }

  async getUserWorkoutSchedules(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/workout-schedules/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async getWorkoutScheduleById(id) {
    return this.request(`/workout-schedules/${id}`);
  }

  async getWorkoutScheduleDetails(id) {
    return this.request(`/workout-schedules/${id}/details`);
  }

  async getLatestWorkoutSchedule(userId) {
    return this.request(`/workout-schedules/user/${userId}/latest`);
  }

  async createWorkoutSchedule(scheduleData) {
    return this.request('/workout-schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateWorkoutSchedule(id, scheduleData) {
    return this.request(`/workout-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  async markWorkoutCompleted(id) {
    return this.request(`/workout-schedules/${id}/complete`, { method: 'PATCH' });
  }

  async deleteWorkoutSchedule(id) {
    return this.request(`/workout-schedules/${id}`, { method: 'DELETE' });
  }

  // Chats
  async getChats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/chats${queryString ? `?${queryString}` : ''}`);
  }

  async getUserChat(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/chats/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async sendMessage(userId, messageData) {
    return this.request(`/chats/user/${userId}/message`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessagesAsRead(userId) {
    return this.request(`/chats/user/${userId}/read`, { method: 'PATCH' });
  }

  async deleteMessage(messageId) {
    return this.request(`/chats/message/${messageId}`, { method: 'DELETE' });
  }

  async getChatStats() {
    return this.request('/chats/stats');
  }

  // Body Measurements
  async getBodyMeasurements(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/body-measurements${queryString ? `?${queryString}` : ''}`);
  }

  async getUserBodyMeasurements(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/body-measurements/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async getUserLatestMeasurements(userId) {
    return this.request(`/body-measurements/user/${userId}/latest`);
  }

  async getUserOnboarding(userId) {
    return this.request(`/onboarding/user/${userId}`);
  }

  async createBodyMeasurement(measurementData) {
    return this.request('/body-measurements', {
      method: 'POST',
      body: JSON.stringify(measurementData),
    });
  }

  async updateBodyMeasurement(id, measurementData) {
    return this.request(`/body-measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData),
    });
  }

  async deleteBodyMeasurement(id) {
    return this.request(`/body-measurements/${id}`, { method: 'DELETE' });
  }

  async getUserMeasurementStats(userId, period = '30d') {
    return this.request(`/body-measurements/user/${userId}/stats?period=${period}`);
  }

  // Photos
  async getUserPhotos(userId) {
    // Use non-admin route for photos
    const response = await fetch(`${BASE_URL}/api/photos/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async addUserPhotos(userId, photoData) {
    // Use non-admin route for adding photos
    const response = await fetch(`${BASE_URL}/api/photos/user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(photoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async updatePhotos(photoId, photoData) {
    // Use non-admin route for updating photos
    const response = await fetch(`${BASE_URL}/api/photos/${photoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(photoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async deletePhotos(photoId) {
    // Use non-admin route for deleting photos
    const response = await fetch(`${BASE_URL}/api/photos/${photoId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getLatestUserPhotos(userId) {
    // Use non-admin route for latest photos
    const response = await fetch(`${BASE_URL}/api/photos/user/${userId}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // User Profiles
  async getUserProfile(userId) {
    // Use non-admin route for user profiles
    const response = await fetch(`${BASE_URL}/api/user-profiles/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getUserProfilePhoto(userId) {
    // Use non-admin route for user profile photo
    const response = await fetch(`${BASE_URL}/api/user-profiles/user/${userId}/photo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async updateUserProfile(userId, profileData) {
    // Use non-admin route for updating user profile
    const response = await fetch(`${BASE_URL}/api/user-profiles/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export default new ApiService();