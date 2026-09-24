'use client';

import dynamic from 'next/dynamic';

const AdminCompilerClient = dynamic(
  () => import('./AdminCompilerClient'),
  { ssr: false }
);

export default function EventAdminPage() {
  return <AdminCompilerClient />;
}
