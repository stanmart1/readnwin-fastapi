import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { apiClient } from '@/lib/api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await apiClient.login(credentials.email, credentials.password);
          
          if (response.access_token) {
            apiClient.setToken(response.access_token);
            return {
              id: response.user.id.toString(),
              email: response.user.email,
              username: response.user.username,
              firstName: response.user.first_name || '',
              lastName: response.user.last_name || '',
              role: 'user',
              roleDisplayName: 'User',
              roles: ['user'],
              permissions: [],
              lastLogin: new Date().toISOString()
            };
          }
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.roleDisplayName = user.roleDisplayName;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.lastLogin = user.lastLogin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.roleDisplayName = token.roleDisplayName;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
        session.user.lastLogin = token.lastLogin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}; 