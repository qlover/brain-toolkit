import { NotFoundPage } from '@/uikit/components-app/NotFoundPage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404' };

export default function NotFound() {
  return <NotFoundPage />;
}
