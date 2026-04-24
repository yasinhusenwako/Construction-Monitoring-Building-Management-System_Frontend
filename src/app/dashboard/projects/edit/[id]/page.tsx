import { EditProjectPage } from '@/views/projects/EditProjectPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditProjectPage projectId={id} />;
}
