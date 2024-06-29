
function runMusic(textarea_id, err_out_id) {
    let txt = document.getElementById(textarea_id).value;
    let parsed_and_error = parseMusic(txt);
    let err_out = document.getElementById(err_out_id);
    err_out.innerText = parsed_and_error[1];
    if (parsed_and_error[1]) {
        return;
    }
    let evaled = evalParsedMusic(parsed_and_error[0], global_variables);
    while(err_out.firstChild) err_out.removeChild(err_out.firstChild);

    if (evaled && evaled.type === "Error") {
        err_out.appendChild(document.createTextNode(evaled.message));
        let stacktrace = document.createElement("ol");
        evaled.stacktrace.forEach(function (lvl) {
            let lvl_node = document.createElement("li");
            lvl_node.appendChild(document.createTextNode(lvl));
            stacktrace.appendChild(lvl_node);
        });
        err_out.appendChild(stacktrace);
    }
}

function codeOfTimbre(timbre) {
    let overtone_args = timbre.harmonics.map((h, i) => h + " " + timbre.amplitudes[i]).join(" ");
    let preamble = "(with-overtones " + overtone_args;
    if (!timbre.adsr) {
        return preamble  + " [notes...])";
    }
    let fn_bit = "(fn (adsr-bit n) (with-adsr " + [timbre.adsr.a_vol, timbre.adsr.d_start, timbre.adsr.s_start, timbre.adsr.s_vol, timbre.adsr.r_start].join(" ") + " n))";
    return preamble + " (map " + fn_bit + " [notes...]))";
}

function makeSnippetClicker(err_id, txt_box_id, snippets_targets, snippet) {
    return function(event) {
        document.getElementById(err_id).innerText = "";
        let text = document.getElementById(txt_box_id).value;
        if (!text && !snippets_targets) {
            document.getElementById(txt_box_id).value = snippet;
            return;
        } else if (!snippets_targets) {
            document.getElementById(err_id).innerText = "Can't add more than one top-level definition";
            return;
        }

        let found_snippet = snippets_targets.map(function(snippet) {
            return [snippet, text.indexOf("[" + snippet + "]")];
        }).filter(function(i) { return i[1] >= 0; });
        if (found_snippet.length > 0) {
            let fsnippet = found_snippet[0][0];
            document.getElementById(txt_box_id).value = text.replace("[" + fsnippet + "]", snippet);
            return;
        }
        found_snippet = snippets_targets.map(function(snippet) {
            return [snippet, text.indexOf("[" + snippet + "...]")];
        }).filter(function(i) { return i[1] >= 0; });
        if (found_snippet.length > 0) {
            let fsnippet = found_snippet[0][0];
            document.getElementById(txt_box_id).value = text.replace("[" + fsnippet + "...]", snippet + " [" + fsnippet + "...]");
        } else {
            document.getElementById(err_id).innerText = "Can't find a proper place to insert the snippet, hints such as [" + snippets_targets + "] required (add ellipsis for mulitple arguments with the same hint).";
        }
    }
}

function makeTimbreTable(err_id, txt_box_id, timbres_id) {
    let table = document.getElementById(timbres_id);

    // title
    let header = document.createElement("tr");
    let col1 = document.createElement("th");
    col1.appendChild(document.createTextNode("Timbre name"));
    header.appendChild(col1);
    let col2 = document.createElement("th");
    col2.appendChild(document.createTextNode("Timbre snippet (click to add to your code)"));
    header.appendChild(col2);
    table.appendChild(header);

    // each row
    Object.keys(known_timbres).forEach(function (timbre) {
        let row = document.createElement("tr");
        let fn_name = document.createElement("td");
        fn_name.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, ['note', 'notes'], "(with-known-timbre " + timbre + " [notes...])"));
        fn_name.appendChild(document.createTextNode(timbre));
        fn_name.classList.add("func-name");
        let fn = document.createElement("td");
        let fn_snip = document.createElement("code");
        let sn = codeOfTimbre(known_timbres[timbre])
        fn_snip.appendChild(document.createTextNode(sn));
        fn.appendChild(fn_snip);
        fn.classList.add("func-name");
        fn.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, ['note', 'notes'], sn));

        //add that row to the table
        row.appendChild(fn_name);
        row.appendChild(fn);
        table.appendChild(row);
    });
}

function makeDocsTable(table_id, txt_box_id, err_id, timbres_id) {
    makeTimbreTable(err_id, txt_box_id, timbres_id);

    let table = document.getElementById(table_id);

    // title
    let header = document.createElement("tr");
    let col1 = document.createElement("th");
    col1.appendChild(document.createTextNode("Function name"));
    header.appendChild(col1);
    let col2 = document.createElement("th");
    col2.appendChild(document.createTextNode("Function snippet (click to add to your code)"));
    header.appendChild(col2);
    let col3 = document.createElement("th");
    col3.appendChild(document.createTextNode("Function docs"));
    header.appendChild(col3);
    table.appendChild(header);

    // each row
    Object.keys(global_variables).forEach(function (global_var) {
        let global = global_variables[global_var];
        if (!global.docs) return;
        let row = document.createElement("tr");
        let fn_name = document.createElement("td");
        fn_name.appendChild(document.createTextNode(global_var));
        let fn = document.createElement("td");
        let fn_snip = document.createElement("code");
        fn_snip.appendChild(document.createTextNode(global.snippet));
        fn.appendChild(fn_snip);
        fn.classList.add("func-name");
        if (global.snippet) {
            fn.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, global.snippets_targets, global.snippet));
        } // if

        // add that row to the table
        let docs = document.createElement("td");
        docs.appendChild(document.createTextNode(global.docs));
        row.appendChild(fn_name);
        row.appendChild(fn);
        row.appendChild(docs);
        table.appendChild(row);
    });
}

// Implements "emacs style lisp indentation".
// See https://wiki.c2.com/?LispIndentation for more.
function formatCode(textarea_id, err_id, rm_hints_checkbox_id) {
    let rm_hints = document.getElementById(rm_hints_checkbox_id).checked;
    let found_hints_warnings = [];
    function checkHint(hint) {
        if (rm_hints && hint.startsWith('[') && hint.endsWith('...]')) {
            return "";
        }
        if (rm_hints && hint.startsWith('[') && hint.endsWith(']')) {
            found_hints_warnings.push(hint);
        }
        return hint;
    }

    function indentTreeLevel(level, indentation) {
        let res = "";
        for(let i = 0; i < indentation; i++) { res += " "; }
        if (!Array.isArray(level)) {
            let checked = checkHint(level);
            return (checked === "")? checked : res + checked;
        } else if (level.some(function(x) { return Array.isArray(x);})) {
            if (Array.isArray(level[0])) {
                res += "(" + indentTreeLevel(level[0], indentation) + ")\n";
            } else {
                res += "(" + level[0] + "\n";
            }
            res += level.slice(1).map(function(arg) {
                return indentTreeLevel(arg, indentation + 2);
            }).join("\n");
            return res + ")";
        } else {
            return res + "(" + level.map(checkHint)
                .filter(function(c) { return c !== ""; })
                .join(" ") + ")";
        }
    }

    let code = document.getElementById(textarea_id).value;
    // let's not care about what the user did
    let parsed_and_err = parseMusic(code);
    if (parsed_and_err[1]) {
        document.getElementById(err_id).innerText = parsed_and_err[1];
        return;
    }

    let parsed = parsed_and_err[0];
    let formatted = indentTreeLevel(parsed, 0);
    document.getElementById(textarea_id).value = formatted;
    if (rm_hints && found_hints_warnings.length > 0) {
        document.getElementById(err_id).innerText = "Found unresolved hints: " + found_hints_warnings.join(", ");
    }
}

function saveEditorTxt(editor_txtarea_id, saved_option) {
    let now = new Date();
    let exp = new Date();
    exp.setTime(now.getTime() + 7 * 24 * 24 * 60 * 1000);
    let cookie = "saved_music_lang=" + document.getElementById(editor_txtarea_id).value;
    cookie += "expires=" +  exp.toUTCString() + ";";
    document.cookie = cookie;
    document.getElementById(saved_option).innerText = "Saved at " + now.toUTCString();
}

function loadDemos(selector_id, editor_txtarea_id) {
    let selector = document.getElementById(selector_id);
    for(demo in demos) {
        let option = document.createElement('option');
        option.innerText = demo;
        option.value = demo.replaceAll(' ', '-');
        selector.appendChild(option);
    }

    selector.addEventListener("change", function(evt) {
        if (selector.value !== "clear") {
            document.getElementById(editor_txtarea_id).value = demos[selector.value.replaceAll('-', ' ')];
            return;
        }
        let maybe_saved_code = document.cookie.split(';').filter((kv) => kv.startsWith('saved_music_lang='));
        console.log(maybe_saved_code);
        if (maybe_saved_code.length > 0) {
            document.getElementById(editor_txtarea_id).value = maybe_saved_code[0].split('=')[1];
        }
    });
}
