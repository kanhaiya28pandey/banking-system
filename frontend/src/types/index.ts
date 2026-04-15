export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  status: 'ACTIVE' | 'BLOCKED';
  phone: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  userId: string;
  balance: number;
  accountType: 'SAVINGS' | 'CURRENT';
  status: 'ACTIVE' | 'BLOCKED';
}

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER';
  date: string;
  status: 'SUCCESS' | 'FAILED';
  description: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}