import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      username?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    username?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id: string;
    role: string;
    username?: string;
  }
}



