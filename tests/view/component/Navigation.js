import {
    TestComponent,
    queryAll,
    prop,
    click,
    asyncMap,
} from 'jezve-test';

const navLinksMap = {
    accountsLink: '/accounts/',
    personsLink: '/persons/',
    categoriesLink: '/categories/',
    transactionsLink: '/transactions/',
    scheduleLink: '/schedule/',
    statisticsLink: '/statistics/',
    importLink: '/import/',
    aboutLink: '/about/',
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
            href: await prop(elem, 'href'),
        }));
        navLinks.forEach((link) => {
            for (const name in navLinksMap) {
                if (link.href.endsWith(navLinksMap[name])) {
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

    async goToSchedule() {
        await click(this.content.scheduleLink.elem);
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
