/**
 * API Integration Layer
 * 
 * This module provides a unified way to connect to external systems and APIs.
 * It handles authentication, request formatting, and response parsing.
 */

import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

// API configuration types
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Integration system types
export type IntegrationType = 'erp' | 'hrms' | 'crm' | 'lms' | 'custom';

// Default configurations for common integration systems
const DEFAULT_CONFIGS: Record<IntegrationType, Partial<ApiConfig>> = {
  erp: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  hrms: {
    timeout: 8000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  crm: {
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  lms: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  custom: {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
};

/**
 * Creates an API client for a specific integration
 */
export class ApiClient {
  private config: ApiConfig;
  private client: any; // Using any temporarily to avoid type errors
  
  constructor(type: IntegrationType, config: Partial<ApiConfig>) {
    // Merge default config with provided config
    this.config = {
      ...DEFAULT_CONFIGS[type],
      ...config
    } as ApiConfig;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.config.headers
    });
    
    // Add request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        // Add API key if provided
        if (this.config.apiKey) {
          config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common API errors
        if (error.response) {
          // Server responded with non-2xx status
          console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request was made but no response received
          console.error('API No Response:', error.request);
        } else {
          // Error in setting up the request
          console.error('API Request Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get(endpoint, { params }) as { data: T };
    return response.data;
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.post(endpoint, data) as { data: T };
    return response.data;
  }
  
  /**
   * Make a PUT request to the API
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.client.put(endpoint, data) as { data: T };
    return response.data;
  }
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint) as { data: T };
    return response.data;
  }
  
  /**
   * Make a custom request to the API
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request(config) as { data: T };
    return response.data;
  }
}

/**
 * API Integration Registry 
 * Maintains a registry of all integrations
 */
class ApiIntegrationRegistry {
  private integrations: Map<string, ApiClient> = new Map();
  
  /**
   * Register a new API integration
   */
  register(name: string, type: IntegrationType, config: Partial<ApiConfig>): ApiClient {
    const client = new ApiClient(type, config);
    this.integrations.set(name, client);
    return client;
  }
  
  /**
   * Get an API integration by name
   */
  get(name: string): ApiClient | undefined {
    return this.integrations.get(name);
  }
  
  /**
   * Check if an integration exists
   */
  has(name: string): boolean {
    return this.integrations.has(name);
  }
  
  /**
   * Remove an integration by name
   */
  remove(name: string): boolean {
    return this.integrations.delete(name);
  }
  
  /**
   * Get all registered integrations
   */
  getAll(): [string, ApiClient][] {
    return Array.from(this.integrations.entries());
  }
}

// Export a singleton instance of the registry
export const apiRegistry = new ApiIntegrationRegistry(); 