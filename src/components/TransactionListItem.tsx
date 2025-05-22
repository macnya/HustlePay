import type { Transaction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle2, Clock, Receipt } from 'lucide-react';

interface TransactionListItemProps {
  transaction: Transaction;
}

const getStatusIcon = (status: Transaction['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'failed':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Receipt className="h-4 w-4 text-muted-foreground"/>;
  }
};

const getTypeIconAndColor = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return { icon: <ArrowDownCircle className="h-5 w-5 text-green-600" />, color: 'text-green-600' };
    case 'withdrawal':
    case 'payout':
      return { icon: <ArrowUpCircle className="h-5 w-5 text-red-600" />, color: 'text-red-600' };
    case 'fee':
    case 'fine':
      return { icon: <DollarSign className="h-5 w-5 text-orange-500" />, color: 'text-orange-500' }; // Assuming DollarSign is imported or replaced
    default:
      return { icon: <Receipt className="h-5 w-5 text-muted-foreground" />, color: 'text-muted-foreground' };
  }
};

// Helper component as DollarSign might not be in lucide-react directly for this use case
const DollarSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);


export default function TransactionListItem({ transaction }: TransactionListItemProps) {
  const { icon: typeIcon, color: typeColor } = getTypeIconAndColor(transaction.type);
  const amountPrefix = transaction.type === 'deposit' ? '+' : '-';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="p-2 bg-muted rounded-full">
          {typeIcon}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <p className={`font-semibold text-md ${typeColor}`}>
              {transaction.member ? `${transaction.member} - ` : ''}
              {transaction.description}
            </p>
            <p className={`font-bold text-lg ${typeColor}`}>
              {amountPrefix}KES {transaction.amount.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              {new Date(transaction.date).toLocaleString()} - Via {transaction.method}
            </p>
            <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize text-xs px-2 py-0.5">
              {getStatusIcon(transaction.status)}
              <span className="ml-1">{transaction.status}</span>
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
