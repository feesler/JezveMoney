import { TestView } from 'jezve-test';
import { Header } from './component/Header.js';
import { MessagePopup } from './component/MessagePopup.js';

export class AppView extends TestView {
    constructor({ environment }) {
        super({ environment });

        this.environment = environment;
        if (this.environment) {
            this.environment.inject(this);
        }

        this.model = {};
    }

    isUserLoggedIn() {
        const loggedOutLocations = ['login', 'register'];

        return loggedOutLocations.every((item) => !this.location.includes(`/${item}`));
    }

    async parseContent() {
        return {};
    }

    async buildModel() {
        return {};
    }

    async updateModel() {
        this.model = await this.buildModel(this.content);
    }

    async parse() {
        this.location = await this.url();

        this.header = await Header.create(this, await this.query('.page > .page_wrapper > .header'));

        const msgElem = await this.query('.popup__content.msg');
        this.msgPopup = (msgElem) ? await MessagePopup.create(this, msgElem) : null;
        this.content = await this.parseContent();
        await this.updateModel();
    }

    async closeNotification() {
        if (!this.msgPopup) {
            return;
        }

        await this.performAction(() => this.msgPopup.close());
    }

    /** Click on profile menu item and return navigation promise */
    async goToProfile() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User is not logged in');
        }

        await this.click(this.header.user.menuBtn); // open user menu

        await this.navigation(() => this.click(this.header.user.profileBtn));
    }

    /** Click on logout link from user menu and return navigation promise */
    async logoutUser() {
        await this.click(this.header.user.menuBtn);

        await this.navigation(() => this.click(this.header.user.logoutBtn));
    }

    async goToMainView() {
        if (!this.isUserLoggedIn()) {
            throw new Error('User not logged in');
        }

        await this.navigation(() => this.click(this.header.logo.linkElem));
    }
}
