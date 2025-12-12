export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
  chainId?: string;
}
