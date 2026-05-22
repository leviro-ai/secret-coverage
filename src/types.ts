export type Severity = 'info' | 'warning' | 'critical';

export type Finding = {
  severity: Severity;
  type: string;
  variable: string;
  file?: string;
  message: string;
  recommendation?: string;
};

export type VariableSource = {
  variable: string;
  file: string;
  source: string;
  value?: string;
};

export type ScannerContext = {
  root: string;
};

export type ScannerResult = {
  declared: VariableSource[];
  referenced: VariableSource[];
  findings: Finding[];
};

export type ScanSummary = {
  critical: number;
  warning: number;
  info: number;
  readinessScore: number;
};

export type ScanResult = {
  findings: Finding[];
  summary: ScanSummary;
  declared: VariableSource[];
  referenced: VariableSource[];
};

export type Scanner = (context: ScannerContext) => Promise<ScannerResult>;
