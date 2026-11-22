export type Theme = {
  background: string;
  ink: string;
  number: string;
  numberLine: string;
  utility: string;
  operator: string;
  equals: string;
  statusBar: 'light' | 'dark';
};

export const theme: Theme = {
  background: '#fde6ec',
  ink: '#8c4b66',
  number: '#fee6ec',
  numberLine: '#f8cbd8',
  utility: '#fcdde5',
  operator: '#f8c4d1',
  equals: '#eca9bb',
  statusBar: 'dark',
};
