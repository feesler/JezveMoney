import {
    TestView,
    assert,
    url,
    navigation,
    query,
    prop,
} from 'jezve-test';
import { Header } from './component/Header.js';
import { Navigation } from './component/Navigation.js';
import { Notification } from './component/Notification.js';

export class AppView extends TestView {
    isUserLoggedIn() {
        const loggedOutLocations = ['login', 'register'];

        return loggedOutLocations.every((item) => !this.location.includes(`/${item}`));
    }

    get locale() {
        return this.content.locale;
    }

    async postParse() {
        this.location = await url();

        const documentElem = await query('html');
        this.content.locale = await prop(documentElem, 'lang');

        this.content.header = await Header.create(this, await query('.page > .page_wrapper > .header'));
        this.content.nav = await Navigation.create(this, await query('.offcanvas.navigation'));

        const msgElem = await query('.popup.notification');
        this.content.notification = (msgElem) ? await Notification.create(this, msgElem) : null;
    }

    async closeNotification() {
        if (!this.content.notification) {
            return;
        }

        await this.performAction(() => this.content.notification.close());
    }

    async changeLocale(value) {
        await navigation(() => this.content.header.selectLocale(value));
    }

    async goToProfile() {
        assert(this.isUserLoggedIn(), 'User is not logged in');

        await navigation(() => this.content.header.clickProfileMenuItem());
    }

    async goToSettings() {
        assert(this.isUserLoggedIn(), 'User is not logged in');

        await navigation(() => this.content.header.clickSettingsMenuItem());
    }

    async navigateToAccounts() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToAccounts());
    }

    async navigateToPersons() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToPersons());
    }

    async navigateToCategories() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToCategories());
    }

    async navigateToTransactions() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToTransactions());
    }

    async navigateToStatistics() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToStatistics());
    }

    async navigateToImport() {
        assert(this.isUserLoggedIn(), 'User is not logged in');
        await navigation(() => this.content.nav.goToImport());
    }

    async navigateToAbout() {
        await navigation(() => this.content.nav.goToAbout());
    }

    async logoutUser() {
        await navigation(() => this.content.header.clickLogoutMenuItem());
    }

    async goToMainView() {
        assert(this.isUserLoggedIn(), 'User not logged in');

        await navigation(() => this.content.header.clickLogo());
    }
}
