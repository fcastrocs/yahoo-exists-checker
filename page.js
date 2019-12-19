const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');
const TIMEOUT = 5000;

class Page {
    constructor() {
        this.capabilities = {
            'browserName': 'chrome',
            'chromeOptions': {
                'w3c': false,
            }
        }

        this.driver = new webdriver.Builder()
            .withCapabilities(this.capabilities)
            .setChromeOptions(new chrome.Options()
            .excludeSwitches(["disable-default-apps", "enable-logging"])
            .headless())
            .build();
    }

    async visit(url) {
        return await this.driver.get(url);
    }

    async close() {
        try {
            await this.driver.close();
        } catch (err) {
        }
    }

    async findById(id) {
        try {
            return await this.driver.wait(webdriver.until.elementLocated(webdriver.By.id(id)), TIMEOUT);
        } catch (err) {
            return null;
        }
    };

    async findByName(name) {
        try {
            return await this.driver.wait(webdriver.until.elementLocated(webdriver.By.name(name)), TIMEOUT);
        } catch (err) {
            return null;
        }
    };

    async write(element, txt) {
        return await element.sendKeys(txt);
    };

    async tab(element) {
        return await element.sendKeys(webdriver.Key.TAB);
    };

    async findByTagName(name) {
        try {
            return await this.driver.wait(webdriver.until.elementLocated(webdriver.By.tagName(name)), TIMEOUT);
        } catch (err) {
            return null;
        }
    };

    async getText(element) {
        return await this.driver.wait(async () => {
            return await element.getText();
        }, TIMEOUT);
    }
};

module.exports = Page;