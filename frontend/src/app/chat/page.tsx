// frontend/src/app/chat/page.tsx
'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Search, Send, User } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { fullName: string; role: string };
}

interface Contact {
  id: string;
  fullName: string;
  role?: string;
  email?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr) as { id: string; role?: string };
      setCurrentUserId(user.id);
      if (user.role) setUserRole(user.role);
    } catch {
      router.push('/login');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('joinRoom', currentUserId);
    }
  }, [socket, currentUserId]);

  useEffect(() => {
    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const res = await api.get('/chat/contacts').catch(() => api.get('/users').catch(() => ({ data: [] })));
        const list = Array.isArray(res.data) ? res.data : [];
        setContacts(list.filter((c: Contact) => c.id !== currentUserId));
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    if (currentUserId) loadContacts();
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (cId: string) => {
    setContactId(cId);
    try {
      const res = await api.get(`/chat/${currentUserId}/${cId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !contactId) return;

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: contactId,
      content: newMessage,
    });
    setNewMessage('');
  };

  const handleBack = () => {
    if (userRole === 'PARENT') router.push('/parent');
    else if (userRole === 'STUDENT') router.push('/student');
    else if (userRole === 'ADMIN') router.push('/admin');
    else if (userRole === 'HEAD') router.push('/head');
    else if (userRole === 'REGISTRAR') router.push('/registrar');
    else router.push('/teacher');
  };

  const filteredContacts = useMemo(() => {
    if (!searchContact.trim()) return contacts;
    const q = searchContact.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [contacts, searchContact]);

  const activeContact = contacts.find((c) => c.id === contactId);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <MessageSquare className="h-5 w-5 text-blue-600" /> School Communication Center
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[78vh]">
          {/* Contacts Sidebar */}
          <Card className="md:col-span-4 flex flex-col h-full shadow-sm border-slate-200 overflow-hidden bg-white">
            <div className="p-3 border-b space-y-2 bg-slate-50">
              <div className="font-bold text-sm text-slate-800 flex items-center justify-between">
                <span>Directory & Contacts</span>
                <span className="text-xs font-normal text-slate-500">
                  {filteredContacts.length} online
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  placeholder="Search staff, teachers, parents..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingContacts ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading directory...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {contacts.length === 0 ? 'No contacts found.' : 'No matching contacts.'}
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = contactId === c.id;
                  return (
                    <div 
                      key={c.id} 
                      className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : ''
                      }`}
                      onClick={() => loadConversation(c.id)}
                    >
                      <div className="space-y-0.5">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {c.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {c.email || c.role}
                        </p>
                      </div>
                      {c.role && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {c.role}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Chat Window */}
          <Card className="md:col-span-8 flex flex-col h-full shadow-sm border-slate-200 overflow-hidden bg-white">
            <div className="p-3.5 border-b bg-slate-50 flex items-center justify-between">
              {activeContact ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {activeContact.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{activeContact.fullName}</p>
                    <p className="text-[11px] text-slate-500">{activeContact.role || 'Member'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <User className="h-4 w-4" /> Direct Message
                </div>
              )}
            </div>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 py-20 text-sm">
                  {contactId
                    ? `Start a conversation with ${activeContact?.fullName || 'this contact'}...`
                    : 'Select a contact from the directory to start messaging.'}
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`p-3 rounded-2xl max-w-[75%] shadow-xs text-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[11px] font-semibold text-blue-600 mb-1">
                          {msg.sender?.fullName || 'User'}
                        </p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-[10px] text-right mt-1 ${
                          isMe ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </CardContent>

            <div className="p-3 border-t bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder={contactId ? "Type your message..." : "Select a contact first..."}
                  disabled={!contactId}
                  className="text-sm h-10"
                />
                <Button type="submit" disabled={!contactId || !newMessage.trim()} className="gap-1.5 h-10">
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
