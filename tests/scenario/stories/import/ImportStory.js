import { setBlock, TestStory } from 'jezve-test';
import { ImportListStory } from './ImportListStory.js';
import { ImportRulesStory } from './ImportRulesStory.js';
import { ImportTemplateStory } from './ImportTemplateStory.js';

export class ImportStory extends TestStory {
    async run() {
        setBlock('Import', 1);

        await ImportTemplateStory.run();
        await ImportRulesStory.run();
        await ImportListStory.run();
    }
}
