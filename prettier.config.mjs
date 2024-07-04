/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  trailingComma: 'es5',
  tailwindFunctions: ['clsx', 'tw'],
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
};

export default config;
