// frontend/src/app/chat/page.tsx
'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

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
}

export default function ChatPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr) as { id: string };
    setCurrentUserId(user.id);

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
      try {
        const res = await api.get('/users');
        setContacts(res.data as Contact[]);
      } catch (err) {
        console.error('Failed to load contacts', err);
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

  const loadConversation = async (contactId: string) => {
    setContactId(contactId);
    try {
      const res = await api.get(`/chat/${currentUserId}/${contactId}`);
      setMessages(res.data as Message[]);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/teacher')} className="mb-4">← Back</Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[80vh]">
          <Card className="md:col-span-1 overflow-y-auto">
            <div className="p-4 font-bold border-b">Contacts</div>
            <div className="divide-y">
              {contacts.map(c => (
                <div 
                  key={c.id} 
                  className={`p-3 cursor-pointer hover:bg-slate-50 ${contactId === c.id ? 'bg-slate-100' : ''}`}
                  onClick={() => loadConversation(c.id)}
                >
                  <p className="font-semibold">{c.fullName}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2 flex flex-col h-full">
            <div className="p-4 font-bold border-b bg-white">Chat</div>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg max-w-[70%] ${isMe ? 'bg-blue-500 text-white' : 'bg-slate-200 text-black'}`}>
                      <p className="text-xs opacity-70 mb-1">{msg.sender?.fullName}</p>
                      <p>{msg.content}</p>
                      <p className="text-[10px] opacity-50 text-right mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <p className="text-center text-slate-400 mt-10">Select a contact to start chatting</p>}
              <div ref={bottomRef} />
            </CardContent>
            <div className="p-4 border-t bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Type a message..." 
                  disabled={!contactId}
                />
                <Button type="submit" disabled={!contactId}>Send</Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}