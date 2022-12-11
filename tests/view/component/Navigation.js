import {
    TestComponent,
    queryAll,
    prop,
    click,
    asyncMap,
} from 'jezve-test';

const navLinksMap = {
    accountsLink: 'Accounts',
    personsLink: 'Persons',
    categoriesLink: 'Categories',
    transactionsLink: 'Transactions',
    statisticsLink: 'Statistics',
    importLink: 'Import',
    aboutLink: 'About',
};

export class Navigation extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        const res = {};

        const navElems = await queryAll(this.elem, '.nav-item__link');
        const navLinks = await asyncMap(navElems, async (elem) => ({
            elem,
            title: await prop(elem, 'textContent'),
        }));
        navLinks.forEach((link) => {
            for (const name in navLinksMap) {
                if (navLinksMap[name] === link.title) {
                    res[name] = link;
                    break;
                }
            }
        });

        return res;
    }

    async goToAccounts() {
        await click(this.content.accountsLink.elem);
    }

    async goToPersons() {
        await click(this.content.personsLink.elem);
    }

    async goToCategories() {
        await click(this.content.categoriesLink.elem);
    }

    async goToTransactions() {
        await click(this.content.transactionsLink.elem);
    }

    async goToStatistics() {
        await click(this.content.statisticsLink.elem);
    }

    async goToImport() {
        await click(this.content.importLink.elem);
    }

    async goToAbout() {
        await click(this.content.aboutLink.elem);
    }
}
