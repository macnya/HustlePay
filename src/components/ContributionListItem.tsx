import type { Contribution } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CalendarDays, Info, User, Landmark, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface ContributionListItemProps {
  contribution: Contribution;
  chamaName?: string; // Optional: if you want to display chama name directly
}

const getStatusBadgeVariant = (status: Contribution['status']) => {
  switch (status) {
    case 'paid':
      return 'default'; // Or a custom success variant
    case 'pending':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: Contribution['status']) => {
  switch (status) {
    case 'paid':
      return <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 mr-1 text-yellow-600" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 mr-1 text-red-500" />;
    default:
      return null;
  }
};


export default function ContributionListItem({ contribution, chamaName }: ContributionListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-lg text-primary">
              KES {contribution.amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground flex items-center">
              <Info className="mr-1.5 h-4 w-4" /> {contribution.description}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(contribution.status)} className="capitalize text-xs">
            {getStatusIcon(contribution.status)}
            {contribution.status}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> 
            Date: {new Date(contribution.date).toLocaleDateString()}
          </div>
          {chamaName && (
            <div className="flex items-center">
              <Landmark className="mr-1.5 h-3.5 w-3.5" /> 
              Chama: {chamaName}
            </div>
          )}
          {contribution.memberName && (
            <div className="flex items-center">
              <User className="mr-1.5 h-3.5 w-3.5" /> 
              For: {contribution.memberName}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
