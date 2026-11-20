'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Video, FileText, ArrowLeft, ExternalLink, Download } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
  teacher?: { user?: { fullName: string } };
}

export default function StudentLearningHubPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (selectedType !== 'ALL') params.type = selectedType;
        if (search) params.search = search;
        const res = await api.get('/resources', { params });
        setResources(res.data);
      } catch (err) {
        console.error('Failed fetching resources', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [selectedType, search]);

  const getTypeIcon = (type: string) => {
    if (type.includes('VIDEO')) return <Video className="h-5 w-5 text-red-500" />;
    if (type.includes('BOOK')) return <BookOpen className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">24/7 Learning Hub</h1>
            <p className="text-slate-500">Digital library: download lesson notes, ebooks, and stream recorded video lessons</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'LESSON_NOTE', 'E_BOOK', 'VIDEO_LESSON'].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search library materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Material Items Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading learning materials...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border text-slate-500">
            No learning materials found for the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <Card key={res.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(res.type)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {res.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(res.createdAt).toLocaleDateString()}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <CardTitle className="text-base text-slate-900 line-clamp-1">{res.title}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Uploaded by: {res.teacher?.user?.fullName || 'Faculty Instructor'}
                    </p>
                  </div>

                  {res.type.includes('VIDEO') ? (
                    <div className="rounded overflow-hidden bg-slate-900 aspect-video flex items-center justify-center text-white">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
                      >
                        <Video className="h-6 w-6 text-red-500" /> Watch Lesson Stream
                      </a>
                    </div>
                  ) : null}

                  <div className="pt-2 flex justify-end gap-2">
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="secondary" size="sm" className="w-full flex items-center gap-2">
                        {res.type.includes('VIDEO') ? (
                          <>
                            <ExternalLink className="h-4 w-4" /> Watch Video
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" /> Download Material
                          </>
                        )}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
