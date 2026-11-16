// List rendering tests. Expected HTML matches marked@18.2.0 (default GFM options).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from './parse.js';

const cases = [
  ['tight bullet list', '- one\n- two\n- three\n',
    '<ul>\n<li>one</li>\n<li>two</li>\n<li>three</li>\n</ul>\n'],
  ['blank line between items makes the list loose', '- one\n\n- two\n',
    '<ul>\n<li><p>one</p>\n</li>\n<li><p>two</p>\n</li>\n</ul>\n'],
  ['ordered list starting at 1 has no start attribute', '1. a\n2. b\n',
    '<ol>\n<li>a</li>\n<li>b</li>\n</ol>\n'],
  ['ordered list keeps a non-1 start number', '3. three\n4. four\n',
    '<ol start="3">\n<li>three</li>\n<li>four</li>\n</ol>\n'],
  ['ordered list with ) delimiter', '1) a\n2) b\n',
    '<ol>\n<li>a</li>\n<li>b</li>\n</ol>\n'],
  ['changing the bullet character starts a new list', '- a\n+ b\n',
    '<ul>\n<li>a</li>\n</ul>\n<ul>\n<li>b</li>\n</ul>\n'],
  ['changing the ordered delimiter starts a new list', '1. a\n2) b\n',
    '<ol>\n<li>a</li>\n</ol>\n<ol start="2">\n<li>b</li>\n</ol>\n'],
  ['nested bullet list', '- a\n  - b\n  - c\n- d\n',
    '<ul>\n<li>a<ul>\n<li>b</li>\n<li>c</li>\n</ul>\n</li>\n<li>d</li>\n</ul>\n'],
  ['nested ordered list', '1. a\n   1. b\n2. c\n',
    '<ol>\n<li>a<ol>\n<li>b</li>\n</ol>\n</li>\n<li>c</li>\n</ol>\n'],
  ['task list items', '- [ ] todo\n- [x] done\n- [X] Done\n',
    '<ul>\n<li><input disabled="" type="checkbox"> todo</li>\n<li><input checked="" disabled="" type="checkbox"> done</li>\n<li><input checked="" disabled="" type="checkbox"> Done</li>\n</ul>\n'],
  ['loose task list puts the checkbox inside the paragraph', '- [ ] todo\n\n- [x] done\n',
    '<ul>\n<li><p><input disabled="" type="checkbox"> todo</p>\n</li>\n<li><p><input checked="" disabled="" type="checkbox"> done</p>\n</li>\n</ul>\n'],
  ['blank lines inside a fenced block stay in the code', '- item\n\n  ```\n  code\n\n  more\n  ```\n',
    '<ul>\n<li><p>item</p>\n<pre><code>code\n\nmore\n</code></pre>\n</li>\n</ul>\n'],
  ['lazy continuation line joins the item', '- a\nlazy\n- b\n',
    '<ul>\n<li>a\nlazy</li>\n<li>b</li>\n</ul>\n'],
  ['thematic break ends the list', '- a\n- b\n***\n',
    '<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n<hr>\n'],
  ['empty item', '-\n- a\n',
    '<ul>\n<li></li>\n<li>a</li>\n</ul>\n'],
  ['item with multiple paragraphs', '- a\n\n  b\n- c\n',
    '<ul>\n<li><p>a</p>\n<p>b</p>\n</li>\n<li><p>c</p>\n</li>\n</ul>\n'],
  ['inline formatting inside an item', '- **bold** and `code`\n',
    '<ul>\n<li><strong>bold</strong> and <code>code</code></li>\n</ul>\n'],
  ['list can interrupt a paragraph', 'para\n- a\n- b\n',
    '<p>para</p>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n'],
  ['heading inside a tight item', '- # h\n- b\n',
    '<ul>\n<li><h1>h</h1>\n</li>\n<li>b</li>\n</ul>\n'],
  ['fenced block right after tight item text', '- a\n  ```\n  x\n\n  y\n  ```\n- b\n',
    '<ul>\n<li>a<pre><code>x\n\ny\n</code></pre>\n</li>\n<li>b</li>\n</ul>\n'],
  ['heading right after tight item text', '- a\n  # h\n- b\n',
    '<ul>\n<li>a<h1>h</h1>\n</li>\n<li>b</li>\n</ul>\n'],
  ['thematic break right after tight item text', '- a\n  ***\n- b\n',
    '<ul>\n<li>a<hr>\n</li>\n<li>b</li>\n</ul>\n'],
  ['HTML block right after tight item text', '- a\n  <div>\n  x\n  </div>\n- b\n',
    '<ul>\n<li>a<div>\nx\n</div></li>\n<li>b</li>\n</ul>\n'],
  ['heading after a fenced block in a tight item', '- ```\n  x\n  ```\n  # h\n',
    '<ul>\n<li><pre><code>x\n</code></pre>\n<h1>h</h1>\n</li>\n</ul>\n'],
];

for (const [name, markdown, html] of cases) {
  test(name, () => assert.equal(parse(markdown), html));
}
