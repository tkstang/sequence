import { css, html } from 'react-strict-dom';

import { rsdSpikeVars } from '../theme/vars.css.ts';

export default function RsdSpikeScreen() {
  return (
    <html.div
      data-layoutconformance="strict"
      data-testid="rsd-spike.root"
      style={styles.root}
    >
      <html.div style={styles.panel}>
        <html.span style={styles.eyebrow}>React Strict DOM</html.span>
        <html.span style={styles.title}>Sequence Online</html.span>
        <html.span style={styles.body}>
          Shared tokens are flowing through an RSD surface. Flip the simulator
          appearance to verify the dark values.
        </html.span>
      </html.div>
    </html.div>
  );
}

const styles = css.create({
  root: {
    alignItems: 'center',
    backgroundColor: rsdSpikeVars.background,
    display: 'flex',
    justifyContent: 'center',
    minHeight: '100%',
    padding: '24px',
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(127,127,127,0.35)',
    borderRadius: '16px',
    borderStyle: 'solid',
    borderWidth: '1px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '360px',
    padding: '24px',
  },
  eyebrow: {
    color: rsdSpikeVars.text,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0px',
    opacity: 0.68,
    textTransform: 'uppercase',
  },
  title: {
    color: rsdSpikeVars.text,
    fontSize: '30px',
    fontWeight: '800',
    letterSpacing: '0px',
    lineHeight: 1.15,
  },
  body: {
    color: rsdSpikeVars.text,
    fontSize: '16px',
    lineHeight: 1.4,
    opacity: 0.78,
  },
});
