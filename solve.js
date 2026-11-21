// solve.js - Optimized parser for csv-reader 1.0.0
export function run(input) {
  let text = String(input.text);
  const header = input.header === true;

  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const len = text.length;
  let pos = 0;
  let line = 1;

  let columns = null;
  const rows = [];
  const errors = [];
  let width = -1;
  let rowIdx = 0;

  function addError(code, errLine, isHeader) {
    errors.push({
      code,
      line: errLine,
      row: isHeader ? null : rowIdx
    });
  }

  while (pos < len) {
    let recordStartLine = line;
    let isHeaderRecord = (header && columns === null);
    
    // Fast path check for clean line-based record
    let lineEnd = text.indexOf('\n', pos);
    let candEnd = lineEnd === -1 ? len : lineEnd;
    let hasCR = text.indexOf('\r', pos);
    let hasQuote = text.indexOf('"', pos);
    
    let isCleanLine = false;
    let candSliceEnd = candEnd;
    if (candEnd > pos && (hasCR === -1 || hasCR >= candEnd) && (hasQuote === -1 || hasQuote >= candEnd)) {
      if (candEnd > pos && text.charCodeAt(candEnd - 1) === 13) {
        candSliceEnd = candEnd - 1;
      }
      isCleanLine = true;
    }

    if (isCleanLine) {
      let lineText = text.slice(pos, candSliceEnd);
      // Advance pos
      if (lineEnd === -1) {
        pos = len;
      } else {
        pos = lineEnd + 1;
      }
      line++;

      if (lineText.length === 0) {
        continue;
      }

      let fieldValues = lineText.split(',');
      if (fieldValues.length === 1 && fieldValues[0] === '') {
        continue;
      }

      if (header && columns === null) {
        columns = fieldValues;
        width = columns.length;
      } else {
        if (width === -1) {
          width = fieldValues.length;
        }
        if (fieldValues.length < width) {
          errors.push({ code: 'short_row', line: recordStartLine, row: rowIdx, fields: fieldValues.length });
          while (fieldValues.length < width) fieldValues.push('');
          rows.push(fieldValues);
          rowIdx++;
        } else if (fieldValues.length > width) {
          const extra = fieldValues.slice(width);
          const cut = fieldValues.slice(0, width);
          errors.push({ code: 'long_row', line: recordStartLine, row: rowIdx, extra });
          rows.push(cut);
          rowIdx++;
        } else {
          rows.push(fieldValues);
          rowIdx++;
        }
      }
      continue;
    }

    // General path
    let fieldValues = [];
    let recordHasContent = false;
    let firstFieldIsQuoted = false;

    while (pos < len) {
      let fieldStartPos = pos;
      let fieldStartLine = line;
      let isQuoted = false;

      if (pos < len && text.charCodeAt(pos) === 34) {
        isQuoted = true;
        pos++; // skip opening quote
        let rawContentStart = pos;
        let closed = false;
        let quoteLine = line;

        while (pos < len) {
          let ch = text.charCodeAt(pos);
          if (ch === 10) {
            line++;
            pos++;
          } else if (ch === 13) {
            if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
              line++;
              pos += 2;
            } else {
              line++;
              pos++;
            }
          } else if (ch === 34) {
            if (pos + 1 < len && text.charCodeAt(pos + 1) === 34) {
              pos += 2;
            } else {
              closed = true;
              let rawContentEnd = pos;
              pos++; // skip closing quote

              let raw = text.slice(rawContentStart, rawContentEnd);
              let val = '';
              let hasSpecial = raw.indexOf('"') !== -1 || raw.indexOf('\r') !== -1 || raw.indexOf('\n') !== -1;
              
              if (!hasSpecial) {
                val = raw;
              } else {
                let rpos = 0;
                let rlen = raw.length;
                while (rpos < rlen) {
                  let rch = raw.charCodeAt(rpos);
                  if (rch === 13) {
                    if (rpos + 1 < rlen && raw.charCodeAt(rpos + 1) === 10) {
                      val += '\n';
                      rpos += 2;
                    } else {
                      val += '\n';
                      rpos++;
                    }
                  } else if (rch === 10) {
                    val += '\n';
                    rpos++;
                  } else if (rch === 34 && rpos + 1 < rlen && raw.charCodeAt(rpos + 1) === 34) {
                    val += '"';
                    rpos += 2;
                  } else {
                    val += raw[rpos];
                    rpos++;
                  }
                }
              }

              let tailCharsAppended = 0;
              while (pos < len) {
                let tch = text.charCodeAt(pos);
                if (tch === 44 || tch === 10) {
                  break;
                }
                if (tch === 13) {
                  if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
                    break;
                  } else {
                    addError('stray_cr', recordStartLine, isHeaderRecord);
                    pos++;
                  }
                } else {
                  val += text[pos];
                  tailCharsAppended++;
                  pos++;
                }
              }

              if (tailCharsAppended > 0) {
                addError('quote_junk', recordStartLine, isHeaderRecord);
              }

              fieldValues.push(val);
              recordHasContent = true;
              break;
            }
          } else {
            pos++;
          }
        }

        if (!closed) {
          pos = fieldStartPos;
          line = quoteLine;
          addError('unterminated_quote', recordStartLine, isHeaderRecord);

          let uval = '';
          while (pos < len) {
            let uch = text.charCodeAt(pos);
            if (uch === 44) {
              pos++;
              break;
            } else if (uch === 10) {
              break;
            } else if (uch === 13) {
              if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
                break;
              } else {
                addError('stray_cr', recordStartLine, isHeaderRecord);
                pos++;
              }
            } else {
              uval += text[pos];
              pos++;
            }
          }
          fieldValues.push(uval);
          recordHasContent = true;
        }
      } else {
        // Unquoted field
        let uval = '';
        let uStart = pos;
        while (pos < len) {
          let uch = text.charCodeAt(pos);
          if (uch === 44 || uch === 10) {
            break;
          }
          if (uch === 13) {
            if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
              break;
            } else {
              if (uStart < pos) {
                uval += text.slice(uStart, pos);
              }
              addError('stray_cr', recordStartLine, isHeaderRecord);
              pos++;
              uStart = pos;
            }
          } else {
            pos++;
          }
        }
        if (uStart < pos) {
          uval += text.slice(uStart, pos);
        }
        recordHasContent = true;
        fieldValues.push(uval);
      }

      if (fieldValues.length === 1) {
        firstFieldIsQuoted = isQuoted;
      }

      if (pos < len) {
        let ch = text.charCodeAt(pos);
        if (ch === 44) {
          pos++;
          if (pos === len) {
            fieldValues.push('');
            recordHasContent = true;
          }
          continue;
        } else if (ch === 10) {
          line++;
          pos++;
          break;
        } else if (ch === 13) {
          if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
            line++;
            pos += 2;
          } else {
            line++;
            pos++;
          }
          break;
        }
      } else {
        break;
      }
    }

    if (!recordHasContent) {
      continue;
    }

    if (fieldValues.length === 1 && fieldValues[0] === '' && !firstFieldIsQuoted) {
      continue;
    }

    if (header && columns === null) {
      columns = fieldValues;
      width = columns.length;
    } else {
      if (width === -1) {
        width = fieldValues.length;
      }

      if (!header && columns === null) {
        columns = null;
      }

      if (fieldValues.length < width) {
        errors.push({
          code: 'short_row',
          line: recordStartLine,
          row: rowIdx,
          fields: fieldValues.length
        });
        while (fieldValues.length < width) {
          fieldValues.push('');
        }
        rows.push(fieldValues);
        rowIdx++;
      } else if (fieldValues.length > width) {
        const extra = fieldValues.slice(width);
        const cut = fieldValues.slice(0, width);
        errors.push({
          code: 'long_row',
          line: recordStartLine,
          row: rowIdx,
          extra
        });
        rows.push(cut);
        rowIdx++;
      } else {
        rows.push(fieldValues);
        rowIdx++;
      }
    }
  }

  if (header && columns === null) {
    columns = [];
  }

  return { columns, rows, errors };
}
