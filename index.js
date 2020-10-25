
function runMusic(textarea_id, err_out_id) {
    let txt = document.getElementById(textarea_id).value;
    let parsed_and_error = parseMusic(txt);
    document.getElementById(err_out_id).innerText = parsed_and_error[1];
    if (parsed_and_error[1]) {
	return;
    }
    let evaled = evalParsedMusic(parsed_and_error[0], global_variables);
    if (evaled && evaled.type === "Error") {
        document.getElementById(err_out_id).innerText = evaled.message;
    }
}

function makeDocsTable(table_id, txt_box_id, err_id) {
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
	    fn.addEventListener("click", function(event) {
		let text = document.getElementById(txt_box_id).value;
		if (!text && !global.snippets_targets) {
		    document.getElementById(txt_box_id).value = global.snippet;
		    return;
		} else if (!global.snippets_targets) {
		    document.getElementById(err_id).innerText = "Can't add more than one top-level definition";
		    return;
		}

		let found_snippet = global.snippets_targets.map(function(snippet) {
		    return [snippet, text.indexOf("[" + snippet + "]")];
		}).filter(function(i) { return i[1] >= 0; });
		if (found_snippet.length > 0) {
		    let snippet = found_snippet[0][0];
		    document.getElementById(txt_box_id).value = text.replace("[" + snippet + "]", global.snippet);
		    return;
		}
		found_snippet = global.snippets_targets.map(function(snippet) {
		    return [snippet, text.indexOf("[" + snippet + "...]")];
		}).filter(function(i) { return i[1] >= 0; });
		if (found_snippet.length > 0) {
		    let snippet = found_snippet[0][0];
		    document.getElementById(txt_box_id).value = text.replace("[" + snippet + "...]", global.snippet + " [" + snippet + "...]");
		} else {
		    document.getElementById(err_id).innerText = "Can't find a proper place to insert the snippet, hints such as [" + global.snippets_targets + "] required (add ellipsis for mulitple arguments with the same hint).";
		}
	    });
	} // if

        //add that row to the table
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
