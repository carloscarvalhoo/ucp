export type TextBlock = {
  id: string;
  kind: 'heading' | 'body';
  label: string;
  group: string;
  value: string;
  fieldIndices: number[];
};
