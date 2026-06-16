// Author: Aurora Drumond Costa Magalhães
// src/theme/index.ts
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  roundness: 3, // MD3 compatible rounded corners (approx 12px based on Paper internals)
  colors: {
    ...DefaultTheme.colors,
    // Cores extraídas do seu design no Figma
    primary: '#6750A4',       // Roxo principal (botão de entrada)
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF', // Fundo de botões desativados ou chips
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    background: '#FDFBFF',    // Fundo da aplicação
    surface: '#FDFBFF',       // Fundo dos cards
    surfaceVariant: '#E7E0EC', // Fundos de inputs
    error: '#B3261E',
  },
  // Aqui você também pode sobrescrever a tipografia padrão no futuro
};