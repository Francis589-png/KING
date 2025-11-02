'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { uploadKnowledge, refinePersonaAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const initialPersona = `You are King A.J., a knowledgeable and wise monarch specializing in technology. Your tone is regal, yet helpful and approachable. You refer to your users as 'my loyal subjects'. You provide comprehensive answers to technical questions, drawing from a vast knowledge base of programming, software architecture, and all things tech. Your goal is to assist and educate on technical matters, maintaining a royal and dignified personality.`;

export default function AdminPage() {
    const { toast } = useToast();
    const [knowledgeState, knowledgeAction] = useActionState(uploadKnowledge, null);
    const [personaState, personaAction] = useActionState(refinePersonaAction, null);

    const knowledgeFormRef = useRef<HTMLFormElement>(null);
    const personaFormRef = useRef<HTMLFormElement>(null);
    
    const [refinedPersona, setRefinedPersona] = useState<string | null>(null);

    useEffect(() => {
        if (knowledgeState?.success) {
            toast({
                title: 'Success!',
                description: knowledgeState.message,
            });
            knowledgeFormRef.current?.reset();
        } else if (knowledgeState?.success === false) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: knowledgeState.message,
            });
        }
    }, [knowledgeState, toast]);

    useEffect(() => {
        if (personaState?.success) {
            toast({
                title: 'Success!',
                description: personaState.message,
            });
            setRefinedPersona(personaState.refinedPersona ?? null);
        } else if (personaState?.success === false) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: personaState.message,
            });
        }
    }, [personaState, toast]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="font-headline text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="knowledge">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="users">User Profiles</TabsTrigger>
          <TabsTrigger value="persona">AI Persona</TabsTrigger>
        </TabsList>
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Update Knowledge Base</CardTitle>
              <CardDescription>Upload new information to expand King A.J.&apos;s knowledge.</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={knowledgeFormRef} action={knowledgeAction} className="space-y-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="knowledge">Knowledge Content</Label>
                  <Textarea placeholder="Paste or write knowledge content here." id="knowledge" name="knowledge" rows={10} />
                  {knowledgeState?.errors?.knowledge && (
                    <p className="text-sm text-destructive">{knowledgeState.errors.knowledge}</p>
                  )}
                </div>
                <Button type="submit">Upload Knowledge</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>USR-001</TableCell>
                    <TableCell>loyal.subject@kingdom.com</TableCell>
                    <TableCell>2024-01-15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>USR-002</TableCell>
                    <TableCell>court.jester@kingdom.com</TableCell>
                    <TableCell>2024-02-20</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="persona">
          <Card>
            <CardHeader>
              <CardTitle>Refine Persona</CardTitle>
              <CardDescription>Adjust King A.J.&apos;s personality based on feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={personaFormRef} action={personaAction} className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="initialPersona">Initial Persona</Label>
                    <Textarea id="initialPersona" name="initialPersona" defaultValue={initialPersona} rows={6}/>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="userFeedback">User Feedback</Label>
                    <Textarea id="userFeedback" name="userFeedback" placeholder="e.g., 'The king is too formal.' or 'I wish he knew more about dragons.'" rows={4}/>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="exampleConversation">Example Conversation</Label>
                    <Textarea id="exampleConversation" name="exampleConversation" placeholder="User: Tell me a joke.\nKing A.J.: I am a king, not a jester." rows={6}/>
                 </div>
                 <Button type="submit">Refine Persona</Button>
              </form>
              {refinedPersona && (
                <Alert className="mt-6">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Refined Persona Suggestion</AlertTitle>
                  <AlertDescription>
                    <p className="font-mono text-sm whitespace-pre-wrap">{refinedPersona}</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
