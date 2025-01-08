export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Service {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}