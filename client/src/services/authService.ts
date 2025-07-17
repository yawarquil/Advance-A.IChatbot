import { User } from '../types/chat';

export class AuthService {
  private token: string | null = null;
  private authListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response;
  }

  private notifyAuthListeners(user: User | null): void {
    this.authListeners.forEach(callback => callback(user));
  }

  async signUp(email: string, password: string): Promise<User> {
    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { user, token } = await response.json();
    this.token = token;
    localStorage.setItem('auth_token', token);
    
    const userData = {
      id: user.id,
      email: user.email,
      createdAt: new Date(user.createdAt),
    };

    this.notifyAuthListeners(userData);
    return userData;
  }

  async signIn(email: string, password: string): Promise<User> {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { user, token } = await response.json();
    this.token = token;
    localStorage.setItem('auth_token', token);
    
    const userData = {
      id: user.id,
      email: user.email,
      createdAt: new Date(user.createdAt),
    };

    this.notifyAuthListeners(userData);
    return userData;
  }

  async signOut(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    this.notifyAuthListeners(null);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.makeRequest('/api/auth/me');
      const { user } = await response.json();
      
      return {
        id: user.id,
        email: user.email,
        createdAt: new Date(user.createdAt),
      };
    } catch (error) {
      // Token might be expired or invalid
      this.token = null;
      localStorage.removeItem('auth_token');
      return null;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.authListeners.push(callback);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authListeners.indexOf(callback);
            if (index > -1) {
              this.authListeners.splice(index, 1);
            }
          }
        }
      }
    };
  }
}