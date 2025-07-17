import { createClient } from '@supabase/supabase-js';
import { User, AuthState } from '../types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class AuthService {
  private supabase;

  constructor() {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set up Supabase connection.');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user account');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      createdAt: new Date(data.user.created_at),
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      createdAt: new Date(data.user.created_at),
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      createdAt: new Date(user.created_at),
    };
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          createdAt: new Date(session.user.created_at),
        });
      } else {
        callback(null);
      }
    });
  }
}