export enum Gender {
  Male = 'ذكر',
  Female = 'أنثى',
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  registeredAt: string;
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  price: number;
  unit: string;
  normalRange: string; // Display string, e.g. "70-110"
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Hormones';
}

export enum VisitStatus {
  Pending = 'قيد الانتظار',
  InProcess = 'جاري الفحص',
  Completed = 'مكتمل',
}

export interface TestResult {
  testId: string;
  value: string;
  flag?: 'High' | 'Low' | 'Normal';
  notes?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  status: VisitStatus;
  selectedTestIds: string[];
  results: TestResult[];
  totalCost: number;
  aiAnalysis?: string;
}

export interface LabSettings {
  labName: string;
  address: string;
  phone: string;
  footerText: string;
}
