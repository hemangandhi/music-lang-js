function centsToHertz(cents) {
    // A cent is a hundreth of a semi-tone, so the frequency ratio is 2^(1/1200) per cent.
    return Math.pow(2, cents / 1200);
}

// The set of pre-defined timbres for use in "with-known-timbre".
// Must provide harmonics and amplitudes. May provide an adsr envelope if the instrument must.
const known_timbres = {
    // Experimental guesstimate: this sounds like crap
    'violin': {
	'harmonics': [2,4,8,16,32,64],
	'amplitudes': [0.02, 0.02, 0.0125, 0.0125, 0.0125]
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
	'adsr': {'a_vol': 1.2, 'd_start': 0.05, 's_start': 0.2, 's_vol': 0.4, 'r_start': 0.3}
    }
};
