// A dependency graph that contains any wasm must all be imported
// asynchronously. This `bootstrap.js` file does the single async import, so
// that no one else needs to worry about it again.
// FIXME: remove these as they get oxidized.
/*
import("./globals.js")
  .catch(e => console.error("Error importing `globals.js`:", e));
import("./programming-language.js")
  .catch(e => console.error("Error importing `programming-language.js`:", e));
import("./timbres.js")
  .catch(e => console.error("Error importing `timbres.js`:", e));
*/
import * as wasm from "music-lang-js";
import("./index.js")
  .then(idx => {
      document.getElementById("play-rs").addEventListener("click", wasm.test_run_exec);
  })
  .catch(e => console.error("Error importing `index.js`:", e));

