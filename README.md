# Yet Another Music Language

Another?

I at least know of [this better language](https://github.com/alda-lang/alda).

This is inspired by a [Haskell video](https://youtu.be/FYTZkE5BZ-0) whose results I wanted to
make portable and somewhat reproducible. You can see [my work here](https://hemangandhi.github.io/music-lang-js/).

Now I ramble on about theory -- type and something about sine waves (that I swear isn't _music_ theory).

## The Structure of a Note

> Ceci n'est pas une note.

Because it's just a representation.

A single note is just a sine wave. For a fixed sine wave played over a fixed duration, there are two axes:
frequency and amplitude. However, there are more effects to be had since musicians like to mess with both
over time. In particular, various effects affect frequency for the note's duration:

- vibrato (the frequency moves on a wave)
- glissando (the frequency linearly varies between two frequencies)

There are effects on the amplitude:

- staccato
- legato
- accented
- cresendo (ok this would vary over various notes too)

### Envelopes

[A more general amplitude concept.](https://en.wikipedia.org/wiki/Envelope_(music))
This is important since every note would have an envelope. In fact, "staccato" may
just be a steeper "attack" with a slight "sustain".

### OK, so Types

To manage this, there's three types that seem to matter (at least for the way I'm dealing with notes). Theres:

1. Floats
1. Pitches
1. Notes

A `float` is just a number.

A `pitch` is a mapping from a time to a frequency. This is for *one note* so it's a constant function unless the
note is being played with one of the effects.

A `note` has two functions: the `pitch` and a similar function for the amplitude.

This allows the effects to compose with each other in a neat, known associative way.

## Time

Tempo, since I hardly understand it, will start off as a way to manage beats and manipulate BPM.

## The Language Itself

*Work in progress*

The language is a Lisp. However, there are a few undecided questions:

- How much to allow functions to do?
  - Do I even need real functions or would a handful of patterns suffice?
- Does sequential execution matter?
  - Of course it does for any sense of "melody" but can `play` be some sort of
    [do-notation](https://en.wikibooks.org/wiki/Haskell/do_notation) that manages
    the sequencing?
- How much to default? `play` might be a bare-bones way to manage playing notes, but
  would a function like `play-with-envelope` make sense? Would there be any logic to
  manage if notes provide their own?

## TODOs

If you've read up to here you probably have a bone to pick. Here's the skeleton I'm working with:

Code-related:

- Why does the evaluator try to apply the outermost value? Make it don't.
- Clean up the website a little bit: get a default width textbox and rearrange.

Musical features:

- Overtones to understand/mess with [timbre](https://en.wikipedia.org/wiki/Timbre)
- More of the effects mentioned above (chords first, then the composable effects)

Language features:

- Functions and variables understood.
- I want a notion of key-less melody that can later be played in a given key.

UI features:

- Drag-n-drop interface? (Ouch my funny bone.)