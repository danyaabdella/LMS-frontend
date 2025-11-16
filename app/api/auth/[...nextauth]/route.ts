import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// For NextAuth v5 beta
const auth = NextAuth(authOptions);

// Export the handlers directly
export const { handlers } = auth;
export const { GET, POST } = handlers;

