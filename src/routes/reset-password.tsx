import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [{ title: 'Hesap şifresi | QualiFi' }, { name: 'description', content: 'QualiFi hesabınızın şifresini güvenli şekilde belirleyin.' }, { property: 'og:title', content: 'Hesap şifresi | QualiFi' }, { property: 'og:description', content: 'QualiFi güvenli hesap kurulumu.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: PasswordPage,
});
function PasswordPage() {
  const [ready,setReady]=useState(false),[password,setPassword]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false),[busy,setBusy]=useState(false);
  useEffect(() => {
    const params=new URLSearchParams(window.location.hash.slice(1));const type=params.get('type');if(params.get('error')){setError('Bağlantının süresi dolmuş veya daha önce kullanılmış. Giriş sayfasındaki "Şifre belirle" ile yeni bağlantı isteyin.');return;}
    if(type!=='recovery'&&type!=='invite'){setError('Geçerli davet veya şifre yenileme bağlantısını açın.');return;}
    const check=async()=>{const {data}=await supabase.auth.getUser();setReady(Boolean(data.user));};
    void check(); const {data}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{void check();},0);});
    return ()=>data.subscription.unsubscribe();
  },[]);
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="w-full max-w-sm space-y-5"><h1 className="text-2xl font-semibold">QualiFi hesap şifresi</h1>{done?<><p>Şifreniz kaydedildi.</p><Link to="/admin/leads">Başvurulara git</Link></>:<form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const result=await supabase.auth.updateUser({password});setBusy(false);if(result.error)setError('Şifre kaydedilemedi. Bağlantıyı kontrol edip yeniden deneyin.');else setDone(true);}}><label className="block">Yeni şifre<input className="mt-2 w-full border border-input rounded-md bg-background p-3" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} /></label><Button type="submit" disabled={!ready||busy}>Şifreyi kaydet</Button></form>}{error&&<p role="alert">{error}</p>}</div></main>;
}