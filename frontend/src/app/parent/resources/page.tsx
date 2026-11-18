'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
  teacher?: {
    user?: {
      fullName: string;
    };
  };
}

export default function ParentResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchResources = async () => {
      try {
        const res = await api.get('/resources');
        setResources(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen p-8 flex items-center justify-center text-slate-500">Loading resources...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/parent')}>← Back to Dashboard</Button>
        
        <h1 className="text-2xl font-bold my-4">Learning Hub</h1>

        <Card>
          <CardHeader><CardTitle>Available Resources</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {resources.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-white shadow-sm gap-4">
                  <div>
                    <p className="font-semibold">{r.title} <span className="text-sm text-slate-500 font-normal">({r.type})</span></p>
                    <p className="text-xs text-slate-400 mt-1">
                      By: {r.teacher?.user?.fullName || 'Unknown'} | Added: {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => window.open(r.url, '_blank')}>
                    View / Download
                  </Button>
                </div>
              ))}
              {resources.length === 0 && <p className="text-slate-500 text-center py-4">No resources available.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}