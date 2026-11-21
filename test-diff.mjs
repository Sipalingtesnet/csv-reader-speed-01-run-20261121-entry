import { readFileSync } from 'node:fs';
import { run } from './solve.js';

const oracle = await import('/home/hatch/workspace/makefun/csv-reader-speed-01-run-20261121-kit/csv-reader-speed-01-run-20261121-kit/program/generator/oracle.js');

const casesData = JSON.parse(readFileSync('/home/hatch/workspace/makefun/csv-reader-speed-01-run-20261121-kit/csv-reader-speed-01-run-20261121-kit/practice/input/cases.json', 'utf8'));
const expectedData = JSON.parse(readFileSync('/home/hatch/workspace/makefun/csv-reader-speed-01-run-20261121-kit/csv-reader-speed-01-run-20261121-kit/practice/reference/expected.json', 'utf8'));

console.log("Running practice set verification...");
let allPass = true;
for (let i = 0; i < casesData.length; i++) {
  const got = run(casesData[i].input);
  const exp = expectedData.cases[i].output;
  const gotStr = JSON.stringify(got);
  const expStr = JSON.stringify(exp);
  const pass = gotStr === expStr;
  console.log(`Case ${i} (${casesData[i].id}):`, pass ? "PASS" : "FAIL");
  if (!pass) {
    allPass = false;
    console.log("Expected length:", expStr.length, "Got length:", gotStr.length);
    for (let j = 0; j < Math.max(gotStr.length, expStr.length); j++) {
      if (gotStr[j] !== expStr[j]) {
        console.log(`First diff at index ${j}: expected '${expStr.slice(j, j+40)}', got '${gotStr.slice(j, j+40)}'`);
        break;
      }
    }
  }
}

console.log("\nRunning unit test cases against oracle...");
const unitCases = [
  { name: "a,b,c\\n1,,3\\n", input: { text: "a,b,c\n1,,3\n", header: true } },
  { name: "a,b,c\\n1,2,\\n", input: { text: "a,b,c\n1,2,\n", header: true } },
  { name: "a,b,c\\n,,\\n", input: { text: "a,b,c\n,,\n", header: true } },
  { name: "a,b\\n1,2,,\\n", input: { text: "a,b\n1,2,,\n", header: true } },
  { name: "a,b\\n1,2,,z\\n", input: { text: "a,b\n1,2,,z\n", header: true } },
  { name: "a,b,c\\n\"x\",,3\\n", input: { text: "a,b,c\n\"x\",,3\n", header: true } },
  { name: "a,b,c\\n1,,\"x,y\"\\n", input: { text: "a,b,c\n1,,\"x,y\"\n", header: true } },
  { name: "a,b,c\\n1,,3 (no trailing newline)", input: { text: "a,b,c\n1,,3", header: true } },
  { name: "a,b,c\\r\\n1,,3\\r\\n", input: { text: "a,b,c\r\n1,,3\r\n", header: true } },
  { name: "1,,3\\n header:false", input: { text: "1,,3\n", header: false } },
  { name: "a,b,c\\n1,2,3\\n4,,6\\n", input: { text: "a,b,c\n1,2,3\n4,,6\n", header: true } },
  { name: "A: BOM and header true", input: { text: "\uFEFFa,b\n1,2", header: true } },
  { name: "A: BOM only", input: { text: "\uFEFF", header: true } },
  { name: "B: empty text header true", input: { text: "", header: true } },
  { name: "B: empty text header false", input: { text: "", header: false } },
  { name: "C: stray CRs header true", input: { text: "\r\r\n", header: true } },
  { name: "C: stray CRs header false", input: { text: "\r\r\n", header: false } },
  { name: "C: stray CRs with data", input: { text: "\r\r1,2\n", header: true } },
  { name: "F: quote tail stray CRs", input: { text: "\"a\"\r\r\n", header: true } },
  { name: "F: quote tail quote_junk", input: { text: "\"a\"junk\n", header: true } },
  { name: "G: unterminated quote mid-record", input: { text: "1,\"abc\n2,3", header: true } },
  { name: "G: unterminated quote at EOF", input: { text: "\"abc", header: true } },
  { name: "H: single quoted empty field", input: { text: "\"\"\n1,2", header: true } },
  { name: "H: single empty unquoted line between records", input: { text: "a,b\n\n1,2", header: true } },
  { name: "I: short and long rows", input: { text: "a,b,c\n1\n2,3,4,5", header: true } },
  { name: "E: CRLF and lone CR inside quotes", input: { text: "\"a\r\nb\rc\",2\n", header: true } },
  { name: "E: doubled quotes", input: { text: "\"a\"\"b\",2\n", header: true } },
  { name: "L: trailing comma at EOF", input: { text: "a,b,\n", header: true } },
  { name: "L: text ending after break", input: { text: "a,b\n1,2\n", header: true } },
  { name: "L: no trailing newline", input: { text: "a,b\n1,2", header: true } },
  // Required new unit cases:
  { name: "new: \"a,b\\n\"x\"\\rj,2\\n1\\n\"", input: { text: "a,b\n\"x\"\rj,2\n1\n", header: true } },
  { name: "new: \"a,b\\n\"x\"\\r\\r,2\\n1\\n\"", input: { text: "a,b\n\"x\"\r\r,2\n1\n", header: false } },
  { name: "new: \"a,b\\n\"x\"a\\rb,2\\n1\\n\"", input: { text: "a,b\n\"x\"a\rb,2\n1\n", header: false } },
  { name: "new: \"a,b,c\\n\"x\\ny\"j,2,3\\n1\\n\"", input: { text: "a,b,c\n\"x\ny\"j,2,3\n1\n", header: true } },
  { name: "new: \"a,b,c\\n1,2,3\\n\"x\\ny\"j,5,6\\n1\\n\"", input: { text: "a,b,c\n1,2,3\n\"x\ny\"j,5,6\n1\n", header: false } },
  { name: "new: \"a,b\\n\"x,2\\n\"y,3\\n1\\n\"", input: { text: "a,b\n\"x,2\n\"y,3\n1\n", header: false } },
  { name: "new: \"a,b,c\\n\"x\\ny\"\\rj,2,3\\n\"", input: { text: "a,b,c\n\"x\ny\"\rj,2,3\n", header: true } }
];

let unitPass = true;
for (const uc of unitCases) {
  const got = run(uc.input);
  const exp = oracle.run(uc.input);
  const pass = JSON.stringify(got) === JSON.stringify(exp);
  console.log(`Unit [${uc.name}]:`, pass ? "PASS" : "FAIL");
  if (!pass) {
    unitPass = false;
    console.log("Expected:", JSON.stringify(exp));
    console.log("Got:", JSON.stringify(got));
  }
}

if (allPass && unitPass) {
  console.log("\nALL PRACTICE AND UNIT CASES PASSED SUCCESSFULLY!");
}
