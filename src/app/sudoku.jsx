(function () {
    
    var React = require('react');
    
    

    function Gradient(stop1_hex, stop2_hex, num){
        // stop1 and stop2 must be strings that rep hex color vals.
        stop1_hex = stop1_hex.replace("#","").toUpperCase();
        stop2_hex = stop2_hex.replace("#","").toUpperCase();
        
        var stops = new Array(num),
        stop1_rgb = {r:0,g:0,b:0},
        stop2_rgb = {r:0,g:0,b:0},
        steps = {r:0,g:0,b:0},
        i,r,g,b;
        
        //parse the two input strings into rgb values
        stop1_rgb.r = parseInt(stop1_hex.substr(0,2),16);
        stop1_rgb.g = parseInt(stop1_hex.substr(2,2),16);
        stop1_rgb.b = parseInt(stop1_hex.substr(4,2),16);
        
        stop2_rgb.r = parseInt(stop2_hex.substr(0,2),16);
        stop2_rgb.g = parseInt(stop2_hex.substr(2,2),16);
        stop2_rgb.b = parseInt(stop2_hex.substr(4,2),16);
        
        steps.r = (stop2_rgb.r - stop1_rgb.r)/num;
        steps.g = (stop2_rgb.g - stop1_rgb.g)/num;
        steps.b = (stop2_rgb.b - stop1_rgb.b)/num;
        
        stops[0] = "#"+stop1_hex;
        
        for(i=1; i<num-1; i++){
            r = Math.round(stop1_rgb.r+(i*steps.r)).toString(16);
            g = Math.round(stop1_rgb.g+(i*steps.g)).toString(16);
            b = Math.round(stop1_rgb.b+(i*steps.b)).toString(16);
            
            r = (r.length != 2)?"0"+r:r;
            g = (g.length != 2)?"0"+g:g;
            b = (b.length != 2)?"0"+b:b;
            
            stops[i] = "#"+(r+g+b).toUpperCase();
        }
        
        stops[num-1] = "#"+stop2_hex;
        return stops;
    }


    var Set = function(set){
        this.set = 0;
        this.length = 0;
        if (set instanceof Array){
            this.add(set);
        }else if (set){
            this.set = set;
            this.length = this.calcLength();
        }
    };
    Set.prototype = {
        clear: function(args){
            this.set = 0;
            this.length = 0;
            if (args) this.add(args);
            return this;
        },
        
        add: function(args){
            args = (args instanceof Array) ? args : [args];
            args.each(function(num){
                if (this.contains(num)) return;
                this.set |= 1 << (num - 1);
                this.length++;
            }, this);
            
            return this;
        },
        
        remove: function(args){
            args = (args instanceof Array) ? args : [args];
            args.each(function(num){
                if (!this.contains(num)) return;
                this.set &= ~(1 << (num - 1));
                this.length--;
            }, this);
            
            return this;
        },
        
        contains: function(num){
            return !!(this.set & 1 << (num - 1));
        },
        
        union: function(other, inplace){
            return this.finish(this.set | other.set, inplace);
        },
        
        intersection: function(other, inplace){
            return this.finish(this.set & other.set, inplace);
        },
        
        difference: function(other, inplace){
            return this.finish(this.set & (~other.set), inplace);
        },
        
        equals: function(other){
            return (this.set == other.set);
        },
        
        calcLength: function(){
            return this.toArray().length;
        },
        
        finish: function(set, inplace){
            if (inplace){
                this.set = set;
                this.length = this.calcLength();
                return this;
            } else return new Set(set);
        },
        
        toString: function(sep){
            return this.toArray().join(sep || "");
        },
        
        toArray: function(){
            var set = this.set,
            array = [];
            
            for (var i = 0; set; i++, set >>= 1)
                if((set & 1) == 1) array.push(i + 1);
                
                return array;
            }
        };

    var Sudoku = function(SudokuInstance){
        // private variables:
        var _cell,
            _candidates, // 2d array that will conatain all the markup information
            _masks, // a quick hash to help ident. blocks, rows and col.
            bar_gradient = Gradient('F08080','90EE90',101),
            selected_row = 1, // the current row that is selected.
            selected_col = 1, // the current col that is selected.
            keyCodes, // an array of acceptible keycodes.
            demo_timer,
            demo_frame,
            demo_keys, // an array that will store all the demo keystrokes.

        // private methods:
            // methods for user interaction (key press and mouse events):
            keyPressed = function(c){
                switch(c){
                    case "backspace":
                        backspace();
                        solve();
                        break;

                    case "left":
                        moveSelected(selected_row, (selected_col == 1) ? 9 : selected_col - 1);
                        break;

                    case "up":
                        moveSelected((selected_row == 1) ? 9 : selected_row - 1, selected_col);
                        break;

                    case "right":
                        moveSelected(selected_row, (selected_col == 9) ? 1 : selected_col + 1);
                        break;

                    case "down":
                        moveSelected((selected_row == 9) ? 1 : selected_row + 1, selected_col);
                        break;

                    case "1": case "2": case "3": case "4": case "5":
                    case "6": case "7": case "8": case "9":
                        writeNumberToSelected(c);
                        solve();
                        break;

                    case "c":
                        clear();
                        break;

                    case "d":
                        toggleDemo();
                        break;
                }
            },

            moveSelected = function(i, j){
                SudokuInstance.state._cell[selected_row][selected_col].selected = false;
                //_cell[selected_row][selected_col].removeClass("selected");
                selected_row = i;
                selected_col = j;
                SudokuInstance.state._cell[selected_row][selected_col].selected = true;
                //_cell[selected_row][selected_col].addClass("selected");
                SudokuInstance.forceUpdate();
            },

            backspace = function(){
                //_cell[selected_row][selected_col].removeClass('user-defined').erase('html');
                SudokuInstance.state._cell[selected_row][selected_col].userDefined = false;
                SudokuInstance.state._cell[selected_row][selected_col].html = '';
                SudokuInstance.forceUpdate();
            },

            writeNumberToSelected = function(num){
                /*_cell[selected_row][selected_col].set({
                    'class': 'user-defined selected',
                    'html': num
                });*/
                SudokuInstance.state._cell[selected_row][selected_col].selected = true;
                SudokuInstance.state._cell[selected_row][selected_col].userDefined = true;
                SudokuInstance.state._cell[selected_row][selected_col].html = num;
                SudokuInstance.forceUpdate();
            },


            // methods for when the demo is run.
            // just continuous step through an array
            // containing the keystrokes for the demo.
            stepDemo = function(){
                if (demo_frame < current_demo.length)
                    keyPressed(keyCodes[current_demo[demo_frame++]]);
                else stopDemo();
            },

            toggleDemo = function(){
                if (!demo_timer){
                    stopDemo();
                    clear();
                    current_demo = demo_keys[Math.floor(Math.random()*demo_keys.length)];
                    demo_frame = 0;
                    demo_timer = setInterval(stepDemo, 150);
                } else stopDemo();
            },

            stopDemo = function(){
                if (demo_timer) clearInterval(demo_timer);
                demo_timer = null;
            },

            isDemoRunning = function(){
                return !!demo_timer;
            },

            solve = function(){
                if (initialize()){
                    while(findCandidates());
                    errors();
                }
                output();
                return;
            },

            initialize = function(){
                for (var i = 1; i < 10; i++){
                    for (var j = 1; j < 10; j++){
                        var cell = SudokuInstance.state._cell[i][j],
                            candidates = SudokuInstance.state._candidates[i][j];
                        
                        if(SudokuInstance.state._cell[i][j].userDefined) {
                            SudokuInstance.state._candidates[i][j].clear(SudokuInstance.state._cell[i][j].html);
                            console.log(SudokuInstance.state._cell[i][j].html);
                        }
                        else SudokuInstance.state._candidates[i][j].add([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                        
                        //SudokuInstance.state._cell[i][j].html = false;
    
                        //if (cell.hasClass('user-defined')) candidates.clear(+cell.get('html'));
                        //else candidates.add([1, 2, 3, 4, 5, 6, 7, 8, 9]);

                        //cell.erase('html');
                    }
                }
                SudokuInstance.forceUpdate();
                return !errors();
            },

            output = function(){
                var solved = 0,
                    cell,
                    candidates,
                    num_candidates,
                    contents;

                for (var i = 1; i < 10; i++){
                    for (var j = 1; j < 10; j++){
                        cell = SudokuInstance.state._cell[i][j];
                        //cell.erase('html');
                        candidates = _candidates[i][j];
                        num_candidates = candidates.length;

                        if (num_candidates == 1){
                            //cell.set('html', candidates.toString(""));
                            solved++;
                        } else {
                            contents = "";
                            candidates = candidates.toArray();

                            for (var k = 1, l = 0; k <= 9; k++){
                                if (candidates[l] == k) contents += candidates[l++].toString();
                                else contents += " ";

                                contents += (k % 3 == 0) ? '\n' : ' ';
                            }

                            //new Element("pre", {'text': contents}).inject(cell);
                        }
                    }
                }

                solved = Math.round((solved/81)*100);
                setBar(solved);

            },

            errors = function(){
                var i, j,
                    error = false;

                var check = function(mask){
                    var unique = new Set(),
                        count = 0,
                        candidates, result;

                    result = mask.some(function(info){
                        //candidates = info.candidates;
                        candidates = SudokuInstance.state._candidates[info.candidates[0]][info.candidates[1]];
                        if (candidates.length == 1){
                            unique = unique.union(candidates);
                            count++;
                        }
                        if (unique.length != count) return true;
                        else return false;
                    });

                    if (result) for (var i = 0; i < 9; i++) {
                        //mask[i].cell.addClass('error');
                        SudokuInstance.state._cell[mask[i].cell[0]][mask[i].cell[1]].error = true;
                    }
                    return result;
                };

                // first clear all the previous errors
                for(i = 1; i <= 9; i++)
                    for(j = 1; j <= 9; j++)
                        SudokuInstance.state._cell[i][j].error = false;

                for(i = 1; i <= 3; i++)
                    for(j = 1; j <= 3; j++)
                        error = check(SudokuInstance.state._masks['blocks'][i][j]) || error;

                for(i = 1; i <= 9; i++)
                    error = check(SudokuInstance.state._masks['rows'][i]) || check(SudokuInstance.state._masks['cols'][i]) || error;

                return error;
            },

            findCandidates = function(){
                // return true of a change has occured false otherwise.

                var types = ['blocks', 'rows', 'cols'],
                    fns = [cleanUp, singles, nakedPairs, nakedTriples, hiddenPairs, hiddenTriples],
                    changed = false;

                changed = fns.some(function(fn){
                    return types.some(function(type){
                        return run(type, fn);
                    });
                });
                
                SudokuInstance.forceUpdate();

                if (changed) return true;

                if (pointingPairs()) return true;

                return false;
            },

            run = function(type, funct){
                var changed = false,
                    i, j;

                if (type == 'blocks')
                    for (i = 1; i <= 3; i++)
                        for (j = 1; j <= 3; j++)
                            changed = funct(SudokuInstance.state._masks[type][i][j]) || changed;
                else for (i = 1; i <= 9; i++)
                    changed = funct(SudokuInstance.state._masks[type][i]) || changed;

                return changed;
            },

            cleanUp = function(mask){
                var removed = new Set(),
                    changed = false,
                    candidates, length, i;

                for (i = 0; i < 9; i++)
                    if (mask[i].candidates.length == 1) {
                        //removed = removed.union(mask[i].candidates);
                        removed = removed.union(SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]]);
                    }
                for (i = 0; i < 9; i++){
                    //candidates = mask[i].candidates;
                    candidates = SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]];
                    length = candidates.length;
                    if (length != 1){
                        candidates.difference(removed, true);
                        changed = (candidates.length != length) || changed;
                    }
                }

                return changed;
            },

            singles = function(mask){
                var changed = false,
                    pointer, candidates,
                    count, result;

                for (var n = 1; n <= 9; n++){
                    count = 0;

                    for (var i = 0; i < 9; i++){
                        //candidates = mask[i].candidates;
                        candidates = SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]];

                        if (candidates.length != 1 && candidates.contains(n)){
                            pointer = candidates;
                            count++;
                        }

                        if (count > 1) break;
                    }

                    if (count == 1){
                        pointer.clear(n);
                        changed = true;
                    }
                }

                return changed;
            },

            nakedPairs = function(mask){
                var changed = false,
                    candidates, i_candidates, j_candidates;

                for (var i = 0; i < 8; i++){  //  try every combination
                    //i_candidates = mask[i].candidates;
                    i_candidates = SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]];
                    if (i_candidates.length != 2) continue;

                    for (var j = i + 1; j < 9; j++){
                        //j_candidates = mask[j].candidates;
                        j_candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];
                        if (j_candidates.length != 2 || !i_candidates.equals(j_candidates)) continue;

                        for (var k = 0; k < 9; k++){
                            //candidates = mask[k].candidates;
                            candidates = SudokuInstance.state._candidates[mask[k].candidates[0]][mask[k].candidates[1]];
                            if (k == i || k == j || candidates.length <= 2) continue;

                            if (candidates.intersection(i_candidates).length != 0){
                                changed = true;
                                candidates.difference(i_candidates, true);
                            }
                        }
                    }
                }

                return changed;
            },

            nakedTriples = function(mask){
                var changed = false,
                    candidates, i_candidates, j_candidates, k_candidates,
                    triple;

                for (i = 0; i < 7; i++){
                    //i_candidates = mask[i].candidates;
                    i_candidates = SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]];
                    if (i_candidates.length < 2) continue;

                    for (j = i + 1; j < 8; j++){
                        //j_candidates = mask[j].candidates;
                        j_candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];
                        if (j_candidates.length < 2) continue;

                        for (k = j + 1; k < 9; k++){
                            //k_candidates = mask[k].candidates;
                            k_candidates = SudokuInstance.state._candidates[mask[k].candidates[0]][mask[k].candidates[1]];
                            if (k_candidates.length < 2) continue;

                            triple = i_candidates.union(j_candidates.union(k_candidates));
                            if (triple.length != 3) continue;

                            for (var l = 0; l < 9; l++){
                                //candidates = mask[l].candidates;
                                candidates = SudokuInstance.state._candidates[mask[l].candidates[0]][mask[l].candidates[1]];
                                if (l == i || l == j || l == k || candidates.length < 2) continue;

                                if (candidates.intersection(triple).length != 0){
                                    changed = true;
                                    candidates.difference(triple, true);
                                }
                            }
                        }
                    }
                }

                return changed;
            },

            hiddenPairs = function(mask){
                var changed = false,
                    positions = [],
                    candidates, n, m, j;

                for (n = 1; n <= 9; n++){
                    positions[n] = new Set();

                    for (j = 0; j < 9; j++){
                        //candidates = mask[j].candidates;
                        candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];

                        if (candidates.length != 1 && candidates.contains(n))
                            positions[n].add(j + 1);
                    }
                }

                for (n = 1; n <= 8; n++){
                    if (positions[n].length != 2) continue;

                    for (m = n + 1; m <= 9; m++){
                        if (!positions[n].equals(positions[m])) continue;

                        for (j = 0; j < 9; j++){
                            //candidates = mask[j].candidates;
                            candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];

                            if (positions[n].contains(j + 1) && candidates.length > 2){
                                changed = true;
                                candidates.intersection(new Set([n, m]), true);
                            }
                        }
                    }
                }

                return changed;
            },

            hiddenTriples = function(mask){
                var changed = false,
                    positions = [],
                    candidates, triple, jp1,
                    testn, testm, testl,
                    n, m, l, j;

                for (n = 1; n <= 9; n++){
                    positions[n] = new Set();

                    for (j = 0; j < 9; j++){
                        //candidates = mask[j].candidates;
                        candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];

                        if (candidates.length != 1 && candidates.contains(n))
                            positions[n].add(j + 1);
                    }
                }

                for (n = 1; n <= 7; n++){
                    if (positions[n].length <= 1) continue;

                    for (m = n + 1; m <= 8; m++){
                        if (positions[m].length <= 1) continue;

                        for (l = m + 1; l <= 9; l++){
                            if (positions[l].length <= 1) continue;

                            triple = positions[n].union(positions[m].union(positions[l]));
                            if (triple.length != 3) continue;

                            for (j = 0; j < 9; j++){
                                //candidates = mask[j].candidates;
                                candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];
                                testn = positions[n].contains(j + 1);
                                testm = positions[m].contains(j + 1);
                                testl = positions[l].contains(j + 1);

                                if (candidates.length > 1 &&  (testn || testm || testl) && (candidates.length > (testn + testm + testl))){
                                    changed = true;
                                    candidates.intersection(new Set([n, m, l]), true);
                                }
                            }

                        }
                    }
                }

                return changed;
            },

            pointingPairs = function(){
                var rows = [],
                    cols = [],
                    pointers, mask;

                for (var I = 1; I <= 3; I++){  //  foreach block
                    for (var J = 1; J <= 3; J++){
                        mask = SudokuInstance.state._masks['blocks'][I][J];

                        for (var n = 1; n <= 9; n++){
                            pointers = [];

                            for (var i = 0; i < 9; i++){
                                var info = mask[i],
                                    //candidates = info.candidates,
                                    candidates = SudokuInstance.state._candidates[mask[i].candidates[0]][mask[i].candidates[1]];
                                    contains = candidates.contains(n);

                                if (contains && candidates.legnth == 1) break;

                                if (contains){
                                    pointers.push(info.coords);
                                    if (pointers.length > 3) break;
                                }
                            } //  for each cell

                            pointers_length = pointers.length;

                            if (candidates.legnth == 1 && contains) continue;
                            if (pointers_length < 2 || pointers_length > 3) continue;
                            var obj = {'n': n, 'pointers': pointers};

                            if (pointers_length == 2){
                                if (pointers[0].i == pointers[1].i)
                                    rows.push(obj);
                                else if (pointers[0].j == pointers[1].j)
                                    cols.push(obj);
                            } else {
                                if (pointers[0].i == pointers[1].i && pointers[1].i == pointers[2].i){
                                    rows.push(obj);
                                } else if (pointers[0].j == pointers[1].j && pointers[1].j == pointers[2].j){
                                    cols.push(obj);
                                }
                            }

                        } //  for 1 - 9
                    }
                } //  for each block

                if (rows.length == 0 && cols.length == 0) return false;

                var clean = function(pairs, type){
                    var changed = false,
                        coord = (type == 'rows') ? 'i' : 'j',
                        icoord = (type == 'rows') ? 'j' : 'i',
                        n, min_index, max_index,
                        mask, candidates, index;

                    for (var i = 0; i < pairs.length; i++){
                        n = pairs[i].n;
                        pointers = pairs[i].pointers;
                        mask = SudokuInstance.state._masks[type][pointers[0][coord]];
                        min_index = 10;  max_index = -1;

                        for (var k = 0; k < pointers.length; k++){
                            min_index = Math.min(pointers[k][icoord], min_index);
                            max_index = Math.max(pointers[k][icoord], max_index);
                        }

                        for (var j = 0; j < 9; j++){
                            //candidates = mask[j].candidates;
                            candidates = SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]];
                            index = mask[j].coords[icoord];

                            if ((index < min_index || index > max_index) && candidates.contains(n)){
                                candidates.remove(n);
                                //SudokuInstance.state._masks[type][pointers[0][coord]][j].candidates.remove(n);
                                SudokuInstance.state._candidates[SudokuInstance.state._masks[type][pointers[0][coord]][j].candidates[0]][SudokuInstance.state._masks[type][pointers[0][coord]][j].candidates[1]].remove();
                                SudokuInstance.state._candidates[mask[j].candidates[0]][mask[j].candidates[1]].remove(n);
                                SudokuInstance.forceUpdate();
                                changed = true;
                            }
                        }
                    }
                    return changed;
                };

                return clean(rows, 'rows') || clean(cols, 'cols');
            },

            clear = function(){
                stopDemo();
                setBar(0);
                for(var i = 1; i <= 9; i++)
                    for(var j = 1; j <= 9; j++)
                        SudokuInstance.state._cell[i][j].html = '';
                        
                        
                        SudokuInstance.state._cell[i][j].selected = false;
                        SudokuInstance.state._cell[i][j].userDefined = false; 
                        //_cell[i][j].set({'class': '', 'html': ''});

                moveSelected(1,1);
            },

            setBar = function(percentage){
                SudokuInstance.setState({percentage: percentage});
            },

            toString = function(){
                var string = "",
                    candidates, is_user;

                for (var i = 1; i <= 9; i++){
                    for (var j = 1; j <= 9; j++){
                        candidates = _candidates[i][j];
                        is_user = _cell[i][j].hasClass('user-defined');
                        if (candidates.length == 1 && is_user) string += candidates.toString();
                        else  string += "0";
                    }
                }
                return string;
            },

            fromString = function(string){
                string.replace(/^\s|\s$/, ''); //  trim

                var regex = /[1-9]/,
                    string_length = string.length,
                    index, number;

                clear();

                for (var i = 1; i <= 9; i++){
                    for (var j = 1; j <= 9; j++){
                        number = string.charAt((j - 1) + ((i - 1)*9));
                        if (regex.test(number)){
                            moveSelected(i,j);
                            writeNumberToSelected(number);
                        }
                    }
                }

                solve();
            };

            //  initialize the hell out of everything
            var i, j, I, J;

            _cell = [];
            _candidates = [];
            for (i = 1; i <= 9; i++){
                _cell[i] = [];
                _candidates[i] = [];
                for (j = 1; j <= 9; j++){
                    _cell[i][j] = {selected: false, userDefined: false, html: '', error: false}
                    _candidates[i][j] = new Set();
                }
            }

            _masks = [];
            _masks['rows'] = [];
            _masks['cols'] = [];
            for (i = 1; i <= 9; i++){
                _masks['rows'][i] = [];
                _masks['cols'][i] = [];

                for (j = 1; j <= 9; j++){
                    _masks['rows'][i].push({
                        'coords': {'i': i, 'j': j},
                        'cell': [i, j],
                        'candidates': [i, j]
                    });
                    _masks['cols'][i].push({
                        'coords': {'i': j, 'j': i},
                        'cell': [j, i],
                        'candidates': [j, i]
                    });
                }
            }

            _masks['blocks'] = [];
            for (I = 1; I <= 3; I++){
                _masks['blocks'][I] = [];

                for (J = 1; J <= 3; J++){
                    _masks['blocks'][I][J] = [];

                    for (i = 1; i <= 3; i++){
                        var abs_i = i + (3 * (I - 1));
                        for (j = 1; j <= 3; j++){
                            var abs_j = j + (3 * (J - 1));
                            _masks['blocks'][I][J].push({
                                'cell': [abs_i, abs_j],
                                'coords': {'i': abs_i, 'j': abs_j},
                                'candidates': [abs_i, abs_j]
                            });
                        }
                    }
                }
            }
            
            SudokuInstance.setState({
                _cell: _cell,
                _candidates: _candidates,
                _masks: _masks
            });
            if(DEBUG) console.log(_cell, _candidates, _masks);

            // initialize the key codes array;
            keyCodes = [];

            keyCodes[8] = "backspace";

            keyCodes[37] = "left"; keyCodes[38] = "up";
            keyCodes[39] = "right"; keyCodes[40] = "down";

            keyCodes[67] = "c"; keyCodes[68] = "d";

            keyCodes[49] = keyCodes[97] = "1"; keyCodes[50] = keyCodes[98] = "2";
            keyCodes[51] = keyCodes[99] = "3"; keyCodes[52] = keyCodes[100] = "4";
            keyCodes[53] = keyCodes[101] = "5"; keyCodes[54] = keyCodes[102] = "6";
            keyCodes[55] = keyCodes[103] = "7"; keyCodes[56] = keyCodes[104] = "8";
            keyCodes[57] = keyCodes[105] = "9";

            // the demo stuff:
            demo_frame = 0;
            demo_timer = null;
            demo_keys = [
                [39,39,57,39,40,52,40,50,39,53,38,39,38,49,39,40,53,39,55,39,56,40,57,40,37,52,37,40,51,37,37,37,56,37,38,54,37,56,40,40,55,40,40,57,37,40,52,39,51,39,49,39,38,39,38,54,40,40,39,55,39,38,50,39,39,53],
                [53,39,39,57,39,51,40,56,39,39,39,39,39,38,55,40,40,49,37,53,37,54,40,39,39,53,40,37,49,37,55,40,50,37,37,54,38,50,38,39,49,37,37,37,37,37,52,40,40,49,40,39,52,39,56,40,53,37,54,40,57,39,39,38,52,39,56,38,39,57,39,39,55],
                [40,40,51,39,39,56,39,39,38,39,51,39,50,39,54,38,39,53,40,40,49,37,37,52,40,39,52,40,37,53,40,51,37,49,37,37,52,38,38,53,37,37,37,57,40,54,39,55,40,37,40,49,39,52,40,40,51,39,38,39,49,38,39,50,40,55,40,53,39,56],
                [40,56,39,57,39,52,39,40,57,39,39,53,38,38,54,39,39,50,40,37,53,40,39,49,39,52,40,40,49,37,53,37,37,51,38,50,37,37,56,37,37,37,53,40,40,52,40,40,40,51,39,38,38,50,38,54,39,51,40,56,39,38,49,39,40,55,40,37,50,40,39,39,39,50,39,57,39,38,53,38,37,37,49],
                [39,39,39,51,39,56,39,39,39,39,54,40,37,49,37,57,37,37,37,53,37,37,37,54,40,39,53,40,39,39,39,39,52,39,39,39,49,40,56,37,55,37,37,37,37,37,37,37,52,40,39,50,39,39,39,39,57,39,39,39,40,37,52,37,54,37,37,51,37,55,37,40,37,40,57,39,50,39,39,39,39,39,56],
                [49,40,51,39,38,39,55,39,40,40,49,39,39,38,50,39,52,39,57,39,40,51,40,52,37,37,37,37,49,37,37,54,40,39,52,40,39,53,39,39,39,50,40,40,40,37,53,37,38,56,38,37,54,37,55,40,51,40,37,37,52,37,38,53,39,38,57,38,56],
                [40,57,39,38,55,39,40,52,40,53,40,40,37,51,40,40,40,50,37,40,53,39,39,39,56,38,54,38,51,39,49,38,54,38,37,38,52,38,38,38,39,51,40,40,40,39,53,39,38,50,39,40,54,39,56,40,57,40,40,37,37,53,40,40,52,39,55]
            ];

            //clear();
            moveSelected(1, 1);
        return {
            'setSelected': function(i,j){
                if (isDemoRunning()) return;
                moveSelected(i, j);
            },
            'keyStroke': function(c){
                var key = keyCodes[c];

                if (!key) return true;

                if (isDemoRunning()) stopDemo();
                else keyPressed(key);

                return false;
            },
            'clear': clear,
            'fromString': fromString
        };
    };
    
    
    var Handler = React.createClass({
        
        getInitialState: function(){
            
            var _cell = [];
            var _candidates = [];
            for (i = 1; i <= 9; i++){
                _cell[i] = [];
                _candidates[i] = [];
                for (j = 1; j <= 9; j++){
                    _cell[i][j] = {selected: false};
                    _candidates[i][j] = new Set();
                }
            }
            
            
            return {
                percentage: 0,
                _cell: _cell,
                _candidates: _candidates
            };
        },
        
        getDefaultProps: function(){
            return {
                bar_gradient: Gradient('F08080','90EE90',101)
            };
        },
        
        componentDidMount: function(){
            var sudoku = Sudoku(this);
            
            window.Sudoku = sudoku;
            
            console.log(this.props);
            
            document.addEvent('keydown', function(e){
                return sudoku.keyStroke(e.code);
            });
            
            document.id('sudoku').getElements('td').each(function(td){
                if (td.get('id')) td.addEvent('click', function(){
                    sudoku.setSelected(+this.id.charAt(1), +this.id.charAt(2));
                });
            });
        },
        
        render: function(){
            
            var solved = 0;
            
            var blocks = [], cols = [], rows = [], cells = [];
            for (I = 1; I <= 3; I++){
                rows[I] = [];
                cols[I] = [];
                cells[I] = [];
                
                for (J = 1; J <= 3; J++){
                    rows[I][J] = [];
                    cells[I][J] = [];
                    
                    for (i = 1; i <= 3; i++){
                        cells[I][J][i] = [];

                        var abs_i = i + (3 * (I - 1));
                        for (j = 1; j <= 3; j++){
                            
                            
                            var abs_j = j + (3 * (J - 1));
                            var cell = this.state._cell[abs_i][abs_j];
                            
                            //if(!cell.hasOwnProperty('html')) cell.html = '';
                            
                            var candidates = this.state._candidates[abs_i][abs_j];
                            var num_candidates = candidates.length;
                            
                            if (num_candidates == 1 || cell.hasOwnProperty('userDefined') && cell.userDefined){
                                cell.html = cell.html;
                                solved++;
                            } else {
                                var contents = "";
                                var candidates_array = candidates.toArray();
                                
                                for (var k = 1, l = 0; k <= 9; k++){
                                    if (candidates_array[l] == k) contents += candidates_array[l++].toString();
                                    else contents += " ";
                                    
                                    contents += (k % 3 == 0) ? '\n' : ' ';
                                }
                                
                                //This causes an error
                                cell.html = <pre ref={"candidates"+abs_i+""+abs_j}>{contents}</pre>;
                            }
                            
                            /*_masks['blocks'][I][J].push({
                                'cell': _cell[abs_i][abs_j],
                                'coords': {'i': abs_i, 'j': abs_j},
                                'candidates': _candidates[abs_i][abs_j]
                            });*/
                            
                            var classNames = [
                                cell.hasOwnProperty('selected') && cell.selected ? 'selected' : '',
                                cell.hasOwnProperty('userDefined') && cell.userDefined ? 'user-defined' : '',
                                cell.hasOwnProperty('error') && cell.error ? 'error' : ''
                            ];
                            
                            cells[I][J][i].push(<td 
                                className={classNames.join(' ')}
                                id={"c"+abs_i+""+abs_j}
                                ref={"c"+abs_i+""+abs_j}
                            >
                                {cell.html}
                            </td>);
                        }
                        
                        rows[I][J].include(<tr>
                            {cells[I][J][i]}
                        </tr>);
                    }
                    
                    cols[I].include(<td>
                        <table className="block" id={"b"+I+""+J}><tbody>{rows[I][J]}</tbody></table>
                    </td>);
                }
                
                blocks.include(<tr>{cols[I]}</tr>);
                
                solved = Math.round((solved/81)*100);
            }
            
            return (<div id="sudoku_wrapper">
                    <table id="sudoku">
                        <caption>
                            <strong>Use arrow and number keys to enter a sudoku</strong><br/>
                            (d for demo, c to clear, backspace to delete)
                        </caption>
                    <tbody>{blocks}</tbody>
                </table>
                <div id="completion">
                    <div id="bar" style={{
                        width: solved + "%", 
                        backgroundColor: this.props.bar_gradient[solved]
                    }} />
                </div>
                <div id="output-wrapper">
                    <pre id="output"></pre>
                </div>
            </div>)
        }
    });

    React.render(<Handler />, document.getElementById('bootstrap'));
})();