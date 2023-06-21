import {
    TestComponent,
    evaluate,
} from 'jezve-test';

const navLinksMap = {
    accountsLink: '/accounts/',
    personsLink: '/persons/',
    categoriesLink: '/categories/',
    transactionsLink: '/transactions/',
    scheduleLink: '/schedule/',
    remindersLink: '/reminders/',
    statisticsLink: '/statistics/',
    importLink: '/import/',
    aboutLink: '/about/',
};

export class Navigation extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            return {};
        }

        const res = await evaluate((el, linksMap) => {
            const content = {};

            const menuItems = el.querySelectorAll('.nav-item__link');
            menuItems.forEach((itemEl) => {
                const menuItem = {
                    url: itemEl.href,
                    title: itemEl.textContent.trim(),
                    visible: itemEl && !itemEl.hidden,
                };

                for (const name in linksMap) {
                    if (itemEl.href.includes(linksMap[name])) {
                        content[name] = menuItem;
                        break;
                    }
                }
            });

            return content;
        }, this.elem, navLinksMap);

        return res;
    }

    async clickByMenuItem(menuPath) {
        const itemPath = navLinksMap[menuPath];

        return evaluate((el, path) => {
            const itemEl = el.querySelector(`.nav-item__link[href*="${path}"]`);
            return itemEl?.click();
        }, this.elem, itemPath);
    }

    async goToAccounts() {
        return this.clickByMenuItem('accountsLink');
    }

    async goToPersons() {
        return this.clickByMenuItem('personsLink');
    }

    async goToCategories() {
        return this.clickByMenuItem('categoriesLink');
    }

    async goToTransactions() {
        return this.clickByMenuItem('transactionsLink');
    }

    async goToSchedule() {
        return this.clickByMenuItem('scheduleLink');
    }

    async goToReminders() {
        return this.clickByMenuItem('remindersLink');
    }

    async goToStatistics() {
        return this.clickByMenuItem('statisticsLink');
    }

    async goToImport() {
        return this.clickByMenuItem('importLink');
    }

    async goToAbout() {
        return this.clickByMenuItem('aboutLink');
    }
}
