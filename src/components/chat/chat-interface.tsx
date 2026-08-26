'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Message } from '@/lib/types';
import { Role } from '@/lib/types';
import ChatMessage from './chat-message';
import ChatInput from './chat-input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp, CollectionReference } from 'firebase/firestore';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const userAvatar = PlaceHolderImages.find(img=>img.id==='user-avatar')?.imageUrl ?? '';
interface StoredMessage { id:string; role:Role; content:string; createdAt:Timestamp; }
interface ChatInterfaceProps { initialMessage:Omit<Message,'id'|'createdAt'>; getAiResponse:(messages:Omit<Message,'id'|'createdAt'>[])=>Promise<Omit<Message,'id'|'createdAt'>>; assistantAvatar:string; assistantIcon:React.ReactNode; storageKey:string; }

export default function ChatInterface({initialMessage,getAiResponse,assistantAvatar,assistantIcon,storageKey}:ChatInterfaceProps){
 const [messages,setMessages]=useState<Message[]>([{...initialMessage,id:'initial',createdAt:new Date()}]);const [input,setInput]=useState('');const [isLoading,setIsLoading]=useState(false);const [resetKey,setResetKey]=useState(0);const viewportRef=useRef<HTMLDivElement>(null);const firestore=useFirestore();
 const conversationCol=useMemo(()=>firestore?collection(firestore,storageKey) as CollectionReference<StoredMessage>:null,[firestore,storageKey]);const conversationQuery=useMemo(()=>conversationCol?query(conversationCol,orderBy('createdAt','asc')):null,[conversationCol]);const {data:storedMessages,loading:messagesLoading}=useCollection<StoredMessage>(conversationQuery);
 useEffect(()=>{if(storedMessages){const loaded=storedMessages.map(msg=>({...msg,id:msg.id,createdAt:msg.createdAt?.toDate()??new Date()}));if(loaded.length)setMessages([{...initialMessage,id:'initial',createdAt:new Date()},...loaded]);}},[storedMessages,initialMessage]);
 const saveMessage=async(message:Omit<Message,'id'|'createdAt'>)=>{if(!conversationCol)return;try{await addDoc(conversationCol,{...message,createdAt:serverTimestamp()} as any);}catch(error){console.error('Error saving message:',error);}};
 const askJusu=async(text:string)=>{const trimmed=text.trim();if(!trimmed||isLoading)return;const userMessage={role:Role.user,content:trimmed};const tempId=new Date().toISOString();setMessages(prev=>[...prev,{...userMessage,id:tempId,createdAt:new Date()}]);await saveMessage(userMessage);setInput('');setIsLoading(true);try{const current=[...messages,{...userMessage,id:tempId,createdAt:new Date()}].map(({id,createdAt,...rest})=>rest);const aiMessage=await getAiResponse(current);setMessages(prev=>[...prev,{...aiMessage,id:new Date().toISOString(),createdAt:new Date()}]);await saveMessage(aiMessage);}catch(error){console.error('Failed to get AI response:',error);setMessages(prev=>[...prev,{id:`${Date.now()}-error`,role:Role.assistant,content:'I hit a problem there. Try me again.',createdAt:new Date()}]);}finally{setIsLoading(false);}};
 const handleLiveTurn=async(userText:string,assistantText:string)=>{if(userText){const user={role:Role.user,content:userText};setMessages(prev=>[...prev,{...user,id:`${Date.now()}-u`,createdAt:new Date()}]);await saveMessage(user);}if(assistantText){const assistant={role:Role.assistant,content:assistantText};setMessages(prev=>[...prev,{...assistant,id:`${Date.now()}-a`,createdAt:new Date()}]);await saveMessage(assistant);}};
 const handleNewConversation=()=>{setInput('');setIsLoading(false);setMessages([{...initialMessage,id:'initial',createdAt:new Date()}]);setResetKey(key=>key+1);};
 useEffect(()=>{viewportRef.current?.scrollTo({top:viewportRef.current.scrollHeight,behavior:'smooth'});},[messages]);
 return <Card className="w-full max-w-4xl flex flex-col shadow-2xl flex-1"><CardContent className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden"><div className="flex items-center justify-between pb-3"><span className="text-sm font-medium text-muted-foreground">JUSU AI</span><Button type="button" variant="ghost" size="icon" onClick={handleNewConversation} aria-label="New conversation" title="New conversation"><RotateCcw className="h-4 w-4"/></Button></div><ScrollArea className="flex-grow -mx-4 -mt-4"><div className="space-y-6 p-4" ref={viewportRef}>{messages.map(msg=><ChatMessage key={msg.id} message={msg} assistantAvatar={assistantAvatar} userAvatar={userAvatar} assistantIcon={assistantIcon}/>)}</div></ScrollArea><div className="pt-4 border-t"><ChatInput handleSubmit={async e=>{e.preventDefault();await askJusu(input);}} input={input} handleInputChange={e=>setInput(e.target.value)} onLiveTurn={handleLiveTurn} isLoading={isLoading||messagesLoading} resetKey={resetKey}/></div></CardContent></Card>;
}
