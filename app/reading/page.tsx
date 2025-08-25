'use client';

import Header from '@/components/Header';
import UserLibrary from './UserLibrary';

export default function ReadingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <UserLibrary />
    </div>
  );
}