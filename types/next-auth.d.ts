import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      role: string;
      roleDisplayName: string;
      roles: string[];
      permissions: string[];
      lastLogin: string;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    roleDisplayName: string;
    roles: string[];
    permissions: string[];
    lastLogin: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    roleDisplayName: string;
    roles: string[];
    permissions: string[];
    lastLogin: string;
  }
} 