import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import vm from 'node:vm';

const filename = process.env.TRANSLATOR ?? 'upstream/CSL JSON.js';
const source = readFileSync(filename, 'utf8');
// The Zotero metadata header precedes the executable JavaScript.
const script = new vm.Script(source.slice(source.indexOf('\n}') + 2), { filename });
const software = readFileSync(new URL('./fixtures/software.json', import.meta.url), 'utf8');

function translator(input, Item) {
    let offset = 0;
    const Z = {
        Item,
        read(length) {
            if (offset >= input.length) return false;
            const chunk = input.slice(offset, offset + length);
            offset += chunk.length;
            return chunk;
        }
    };
    const context = vm.createContext({ Z, Zotero: { debug() {} }, ZU: globalThis.Zotero?.Utilities });
    script.runInContext(context);
    return context;
}

for (const [label, input, expected] of [
    ['software citation', software, true],
    ['book citation', '{"type":"book","title":"Example"}', true],
    ['minimal software metadata', '{"type":"software"}', true],
    ['mixed bibliography', '[{"type":"book"},{"type":"software"}]', true],
    ['missing type', '{"title":"Untyped"}', false],
    ['unknown type', '{"type":"unrecognized"}', false],
    ['malformed JSON', '[{', false]
]) {
    test(label, () => assert.equal(translator(input).detectImport(), expected));
}

// Use Zotero's own Node test setup for field and item-type conversion.
createRequire(import.meta.url)(resolve(process.env.UTILITIES, 'test/init.js'));
for (const fixture of translator('').testCases) {
    const expected = structuredClone(fixture.items);
    test('import embedded fixture: ' + expected[0].title, async () => {
        const items = [];
        class Item {
            constructor() {
                Object.assign(this, globalThis.newItem(), { notes: [] });
            }
            complete() {
                // CSL fixtures describe public creator fields, without internal numeric IDs.
                for (const creator of this.creators) delete creator.creatorTypeID;
                items.push(this);
            }
        }
        assert.equal(translator(fixture.input).detectImport(), true);
        await translator(fixture.input, Item).doImport();
        assert.deepEqual(JSON.parse(JSON.stringify(items)), expected);
    });
}
