import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
} from 'jezve-test';

const navLinksMap = {
    accountsLink: 'Accounts',
    personsLink: 'Persons',
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

        const navLinks = await queryAll(this.elem, '.nav-link');
        for (const linkElem of navLinks) {
            const title = await prop(linkElem, 'textContent');
            const link = {
                elem: linkElem,
                title,
            };

            for (const name in navLinksMap) {
                if (navLinksMap[name] === link.title) {
                    res[name] = link;
                    break;
                }
            }
        }

        return res;
    }

    async goToAccounts() {
        await click(this.content.accountsLink.elem);
    }

    async goToPersons() {
        await click(this.content.personsLink.elem);
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
