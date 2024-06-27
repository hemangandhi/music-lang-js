function centsToHertz(cents) {
    // A cent is a hundreth of a semi-tone, so the frequency ratio is 2^(1/1200) per cent.
    return Math.pow(2, cents / 1200);
}

// The set of pre-defined timbres for use in "with-known-timbre".
// Must provide harmonics and amplitudes. May provide an adsr envelope if the instrument must.
const known_timbres = {
    // Not sure where to add more character, but this is a start.
    'violin': {
        'harmonics': [ //centsToHertz(1),
              2 * centsToHertz(3),
              3 * centsToHertz(8),
              4 * centsToHertz(11),
              5 * centsToHertz(2),
              6 * centsToHertz(27),
              8 * centsToHertz(43)],
        'amplitudes': [0.02, 0.02, 0.02, 0.02, 0.02, 0.02],
        // Inspired by https://youtu.be/kCOpBRoE_c4?t=148
        'adsr': {'a_vol': 1.2, 'd_start': 0.25, 's_start': 0.3, 's_vol': 1, 'r_start': 0.9}
    },
    // http://www.afn.org/~afn49304/youngnew.htm for more -- comments below reference this.
    'piano': {
        // Based on Table I (assuming that all notes work like A4 because I'm deaf to the difference).
        // Because of exponentiation, the differences in cents in table I are products in the Hertz.
        'harmonics': [centsToHertz(1),
                  2 * centsToHertz(3),
                  3 * centsToHertz(8),
                  4 * centsToHertz(11),
                  5 * centsToHertz(2),
                  6 * centsToHertz(27),
                  7 * centsToHertz(2),
                  8 * centsToHertz(43)],
        // Hand-tuned.
        'amplitudes': [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02],
        'adsr': {'a_vol': 1.2, 'd_start': 0.01, 's_start': 0.1, 's_vol': 0.6, 'r_start': 0.25}
    },
    // experimental, but decent around the 4th octave.
    'recorder': {
        'harmonics': [3, 4, 5],
        'amplitudes': [0.1, 0.1, 0.1]
    },
    // based on https://youtu.be/wGkdb6YlLgg?t=416
    'melodica': {
        'harmonics': [centsToHertz(8), 2, 3, 4, 5],
        'amplitudes': [0.1, 0.1, 0.1, 0.1, 0.1],
    },
    'euphonium': {
        'harmonics': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'amplitudes': [0.1, 0.1, 0.1, 0.1, 0.01, 0.1, 0.01, 0.05, 0.01, 0.01, 0.01],
        'adsr': {'a_vol': 1.2, 'd_start': 0.2, 's_start': 0.3, 's_vol': 1, 'r_start': 0.5}
    },
};
