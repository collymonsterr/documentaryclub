import { createFileRoute } from '@tanstack/react-router';
import { SimplePage } from '@/components/simple-page';
import { SuggestForm } from '@/components/suggest-form';
import { staticPageHead } from '@/lib/site-urls';

export const Route = createFileRoute('/suggest')({
  head: () => staticPageHead('Suggest a documentary', 'Suggest a documentary for the collection, or send a message.', '/suggest'),
  component: () => <SimplePage title="Suggest a documentary"><SuggestForm /></SimplePage>,
});
