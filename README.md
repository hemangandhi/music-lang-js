# Yet Another Music DSL

Another?

I at least know of [this better language](https://github.com/alda-lang/alda).

This is inspired by a [Haskell video](https://youtu.be/FYTZkE5BZ-0) whose results I wanted to
make portable and somewhat reproducible. You can see [my work here](https://hemangandhi.github.io/music-lang-js/).

Now I ramble on about theory -- programming language theory and something about sine waves (that I swear isn't _music_ theory).

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

### The Representation

Notes are a triple: `(duration, time -> [frequency], time -> [amplitude])`.

## Time

Tempo, since I hardly understand it, will start off as a way to manipulate BPM (with a default of 60 bpm).

## The Language Itself

*Work in progress*

The language is a Lisp in syntax. Technically it has the following mishaps:

- It's dynamically scoped.
- There's no macros.
- There's no strings.
- Everything that's not a variable is a symbol until the function it's passed to decides not to accept it.
- Error handling doesn't exist -- errors only exist to aid my debugging.

There are some questions (other than whether I have it in my heart to fix the mishaps).

- How much to allow functions to do?
  - Do I even need real functions or would a handful of patterns suffice?
- Does sequential execution matter?
  - Of course it does for any sense of "melody" but can `play` be some sort of
    [do-notation](https://en.wikibooks.org/wiki/Haskell/do_notation) that manages
    the sequencing?

### The UI -- Interactive Coding

I have no eyes when it comes to UI. But I try. The site has a textarea for the code and a table which each function documented. The documentation
and interaction system is baked into the language so far. This section is an explanation of this documentation and interactive coding system.

The interactive system started by adding a docstring field to the built-in functions and allowing the automatic creation of a table of functions
(that appears to the right of the textarea, hopefully). These docstrings lead to a pattern: all the functions seem easier to understand with a
snippet of code, with arguments annotated with a hint in square brackets (yay, I don't use them elsewhere).

This culminated with a system for inserting code snippets (since it looked difficult to get the cursor position from a textarea). Each function
(except `play`) also may list the set of hints where a function call would provide the required argument.

To make this legible, instead of just a lengthy one-line string, a formatting button helps out. This can also remove hints for the variadic functions.

### The Quirks of the Functions

There's documentation on the functions in [the UI](https://hemangandhi.github.io/music-lang-js/) but that's for users, not about me ranting about things
I wish weren't true.

| Function/feature | Things I wish weren't true |
|---|---|
| Flattening of lists of notes and notes into one list | That I had to flatten |
| note-seq | IDK, I just think it's gross. Especially if it becomes my hack to legato |
| with-adsr | 5 args is ew. No symbols to make it more readable T_T |
| fn | This doesn't add the function to the environment or manage closures correctly |
| map | Why is this the only way to make lists in this "lisp"?! |
| with-overtones | If only I could actually inline array definitions neatly |
| with-known-timbre | Since this can manipulate just about anything about the note, it's weird to know how to compose with it correctly. |

The `with-known-timbre` abstraction may also need a better representation since the overtones in a piano vary heavily based on the note.

I also sort of wish that there were ways to destructure and play with notes inside the language, but it might be more than necessary.

## TODOs

If you've read up to here you probably have a bone to pick. Here's the skeleton I'm working with:

Code-related:

- Why does the evaluator try to apply the outermost value? Make it don't.
- Better parser so that strings can exist and include spaces.
- Make each module a function with deps as arguments and load the wacky mess in index.html properly.
- Add a library for function error checks to make callables easier to understand.
- Use arrow functions?

Musical features:

- More of the effects mentioned above (chords first, then the composable effects)

Language features:

- I want a notion of key-less melody that can later be played in a given key.
- Decide how to have a "top-level"

Debugging:

- Save music: WTF is up with `document.cookie` not being set?
- Why does music cut out ~5s in?

# Stack-based Effect-based PL

Currently, the language is implemented as a Lisp. This is very complicated for two reasons:

- formatting is hard to do algorithmically (particularly in a `<textarea>`)
- is hard to read
- parens are... a lot

Instead of this, we could use a stack-based parser and use an effect system to manipulate notes.

Really this would be an effect system with one effect: `note` and based on the handlers (registered
on a handler stack), this note would be manipulated into the tempo, timbre, and whatever other
effects. Furthermore, the handler could add more than the 12 diatonic notes to get us micro-tones and
possibly purer ratios.

Since we'll use a stack-based parser system, arithmetic would also be easy to implement to supplement
experiments with pure tones and microtones.

Keywords:

- `audio`
- `context`
- `wave` (special function)

Special symbols:

- `:` for context levels
- `'` for symbols.

| Context | Meaning | Semantics | Syntax? |
|---|---|---|---|
| `phrase` | A phrase of music. A building block for more complicated stuff. | Argument is interpreted as a variable name, lack thereof means that the phrase is anonymous and used to escape a `chord` context. | `[<word>] phrase context:` |
| `tuning` | A context that interprets notes. | Takes an argument that can be dynamically looked up. This will lead to the concrete definition of a note as a waveform. | `<word> tuning context:` |

What follows is psuedo-code for me to understand what I want.

Jingle bells (first 6 chorus notes -- "Jingle bells/Jingle bells"):

```
'bass-notes 'phrase context:
  'diatonic 'tuning context:
    chord context:
      'C 2 4 note
      'G 2 4 note
    chord context:
      'C 2 4 note
      'G 2 4 note

'treble-notes 'phrase context:
  'diatonic 'tuning context:
    'E 3 1 note
    'E 3 1 note
    'E 3 2 note
    'E 3 1 note
    'E 3 1 note
    'E 3 2 note

audio context:
  240 'bpm context:
    1.2 0.05 0.075 1 0.9 'adsr context:
      'chord context:
        bass-notes
        treble-notes
```

Some perfect fifths:
(the notes are 100 hz, 150 hz, 225 hz, and 337.5 hz I think).

```
'fifths 'tuning 'define context:
  n d note = 1.5 n pow 100 * d wave

audio context:
  'fifths 'turning context:
    'chord context:
      0 3 note
      1 3 note
      2 3 note
      3 3 note
```

Defining 12-note diatonic tuning:

```

```
