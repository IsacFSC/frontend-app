import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // or number, depending on your user id type
      role: string; // Add your custom property here
    } & DefaultSession['user'];
  }
}
