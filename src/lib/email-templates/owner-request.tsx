import { Body, Container, Head, Heading, Html, Preview, Text, Link } from '@react-email/components';
import type { TemplateEntry } from './registry';
const Email = ({ page = '', kind = '' }: { page?: string; kind?: string }) => (
  <Html lang="tr"><Head /><Preview>QualiFi yeni başvuru</Preview><Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}><Container style={{ padding: '24px' }}><Heading>QualiFi başvurusu kaydedildi</Heading><Text>Sayfa: {page}</Text><Text>Talep türü: {kind}</Text><Link href="https://qualifilab.com/admin/leads">Özel başvuru panelini aç</Link></Container></Body></Html>
);
export const template = { component: Email, subject: 'QualiFi: Yeni başvuru', displayName: 'Yeni başvuru bildirimi', to: 'talha.guler@ozu.edu.tr' } satisfies TemplateEntry;