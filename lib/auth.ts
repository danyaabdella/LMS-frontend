import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data.success && data.user) {
            return {
              id: String(data.user.id),
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              username: data.user.username,
              accessToken: data.token || data.accessToken, 
            };
          }
          return null;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.accessToken = (user as any).accessToken;
      }
      return token;
      
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).username = token.username as string;
        (session as any).accessToken = token.accessToken;
      }
      return session;
     
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

