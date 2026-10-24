import nextPlugin from 'eslint-config-next/core-web-vitals';

export default [
  ...nextPlugin,
  { ignores: ['src/generated/**', '.next/**', '.next-previous-*/**'] },
];
