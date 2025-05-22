import Link from 'next/link';
import type { Chama } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, DollarSign, ArrowRight, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ChamaCardProps {
  chama: Chama;
}

export default function ChamaCard({ chama }: ChamaCardProps) {
  const progress = chama.goalAmount ? (chama.totalCollected / chama.goalAmount) * 100 : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary mb-1">{chama.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">{chama.description}</CardDescription>
          </div>
          <Image 
            src={`https://placehold.co/60x60.png?text=${chama.name.charAt(0)}`} 
            alt={chama.name} 
            width={48} 
            height={48} 
            className="rounded-lg border"
            data-ai-hint="group savings"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4 text-primary" />
          <span>{chama.members.length} Members</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <DollarSign className="mr-2 h-4 w-4 text-primary" />
          <span>KES {chama.contributionAmount.toLocaleString()} per {chama.contributionFrequency}</span>
        </div>
        {chama.goalAmount && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Target className="mr-2 h-4 w-4 text-primary" />
            <span>Goal: KES {chama.goalAmount.toLocaleString()}</span>
          </div>
        )}
        {chama.nextMeeting && (
            <div className="flex items-center text-sm text-muted-foreground">
                <CalendarClock className="mr-2 h-4 w-4 text-primary" />
                <span>Next Meeting: {new Date(chama.nextMeeting).toLocaleDateString()}</span>
            </div>
        )}
        {chama.goalAmount && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/chamas/${chama.id}`} passHref className="w-full">
          <Button variant="default" className="w-full">
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
