import type { AppRouter } from '@sequence/api';
import { ALL_POSITIONS, BOARD_MAP } from '@sequence/game-logic';
import { StyleSheet, Text, View } from 'react-native';

function contractName<_Router extends AppRouter>() {
  return 'AppRouter';
}

export default function ImportSpikeScreen() {
  const rows = BOARD_MAP.length;
  const columns = BOARD_MAP[0]?.length ?? 0;
  const routerContract = contractName();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import spike</Text>
      <Text>
        Board: {rows} x {columns}
      </Text>
      <Text>Positions: {ALL_POSITIONS.length}</Text>
      <Text>Contract: {routerContract}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
