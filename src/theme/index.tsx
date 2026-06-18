import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

/*
  Tema global do aplicativo.

  Este arquivo centraliza cores, arredondamento e aparência base dos componentes
  do React Native Paper. Alterar aqui afeta Card, Button, TextInput, Snackbar,
  Switch, Chip e outros componentes usados nas telas.

  Não altera nenhuma funcionalidade do app.
*/
export const theme = {
  ...DefaultTheme,

  // Define o arredondamento padrão dos componentes do React Native Paper.
  roundness: 18,

  colors: {
    ...DefaultTheme.colors,

    // Cor principal do app.
    primary: '#D32F2F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFE3E0',
    onPrimaryContainer: '#410002',

    // Cor secundária usada em componentes de apoio.
    secondary: '#2563EB',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DBEAFE',
    onSecondaryContainer: '#0B1B45',

    // Cor terciária para destaques.
    tertiary: '#F59E0B',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FEF3C7',
    onTertiaryContainer: '#422006',

    // Fundo geral das telas.
    background: '#F7F8FC',
    onBackground: '#171923',

    // Superfícies usadas em cards, inputs e blocos internos.
    surface: '#FFFFFF',
    onSurface: '#171923',
    surfaceVariant: '#EEF2F7',
    onSurfaceVariant: '#526071',

    // Bordas e divisões visuais.
    outline: '#D6DEE8',
    outlineVariant: '#E6ECF3',

    // Cores de erro.
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#FDE8E6',
    onErrorContainer: '#410E0B',

    // Cores inversas usadas por alguns componentes internos.
    inverseSurface: '#1F2937',
    inverseOnSurface: '#F9FAFB',
  },
};