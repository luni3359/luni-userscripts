// ==UserScript==
// @name            AWBW: Display Editor
// @description     Press K to edit the appearance of any CO
// @version         1.7.0
// @author          luni3359
// @contributionURL https://ko-fi.com/luni3359
// @match           https://awbw.amarriner.com/*
// @grant           GM.setValue
// @grant           GM.getValue
// @namespace       https://github.com/luni3359/
// @downloadURL     https://raw.githubusercontent.com/luni3359/luni-userscripts/master/advancewars/displayeditor.user.js
// @updateURL       https://raw.githubusercontent.com/luni3359/luni-userscripts/master/advancewars/displayeditor.user.js
// ==/UserScript==

// == == == == == == == WARNING!! IMPORTANT!!! PLEASE READ!!!! == == == == == == == ==
// Press K to open the display options. Don't forget to click "Save" to confirm your changes.
// == == == == == == == == == == == == == == == == == == == == == == == == == == == ==

const charIconRgx = /\/(?<status>gs_)*(?<size>small)*(?<game>aw2|ds)*(?<character>[a-zA-Z]+)\.png$/;

const coNames = [
    "andy", "hachi", "jake", "max", "nell", "rachel", "sami", "colin", "grit",
    "olaf", "sasha", "drake", "eagle", "javier", "jess", "grimm", "kanbei",
    "sensei", "sonja", "adder", "flak", "hawke", "jugger", "kindle", "koal",
    "lash", "sturm", "vonbolt"];

// Injects css to the page
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

// https://stackoverflow.com/a/7224605/7688278
function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1);
}

addGlobalStyle(`
:root {
    --settings-width: 300px;
    --settings-margin: 14px;
    --settings-hide-offset: calc(var(--settings-margin) * -1 + var(--settings-width) * -1);
}

#editor-settings {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 99999;
    height: 465px;
    width: var(--settings-width);
    margin: 11px var(--settings-margin) 0 0;
    transition-property: left, right, box-shadow;
    transition-duration: 0.25s;
    background-color: #FFF;
    box-shadow: 2px 2px 4px 4px rgba(0, 0, 0, 0.2);
}

#editor-settings >.wrapper {
    position: relative;
    padding: 1px;
    height: calc(100% - 3px);
    width: calc(100% - 3px);
    border-style: solid;
    border-width: 1px;
    border-color: #000330;
}

#editor-settings.hidden {
    right: var(--settings-hide-offset);
    box-shadow: unset;
}

#editor-title {
    pointer-events: none;
    padding: 1px 6px;
    margin-bottom: 1px;
    background-color: #0066CC;
    color: #FFF;
    font-weight: bold;
}

#editor-settings .header {
    pointer-events: none;
    padding-left: 8px;
    background-color: #AAAAAA;
    border-style: solid;
    border-width: 0 0 2px 0;
    border-color: #000;
    color: #666666;
    font-weight: bold;
}

#co-category {
    height: 413px;
}

#co-category > .wrapper {
    height: 100%;
    overflow-y: scroll;
}

#co-table {
    display: table;
    height: 413px;
    width: 100%;
}

.co-row {
    display: table-row;
}

.co-cell {
    display: table-cell;
    padding: 2px;
    vertical-align: middle;
    border-style: solid;
    border-width: 0 0 1px 0;
    border-color: black;
}

.base-co-icon {
    display: block;
    pointer-events: none;
    border: 1px solid black;
    height: 32px;
    width: 32px;
}

.co-defeat {
    background-color: #FFF;
    filter: brightness(80%);
}

input[type="text"] {
    display: block;
    width: 65px;
}

input[placeholder$="URL"] {
    width: 65px;
}

#save-settings {
    font-size: 10px;
    position: absolute;
    top: 2px;
    right: 2px;
    padding: 2px;
    height: 21px;
    border-style: solid;
    border-radius: 2px;
}

/* fixes the filter bringing the co pic forward */
span[class*="dot_"] {
    z-index: 1;
}
`);

const Status = {
    UNDEFINED: 0,
    DEFAULT: 1,
    LOST: 2
};

class Character {
    constructor(iconTag, nameTag) {
        this.key = "";
        this.name = "";
        this.icon = "";
        this.status = Status.UNDEFINED;

        this.baseAppearance = true;
        this.alias = "";
        this.customUrl = "";
        this.lostUrl = "";

        this.iconElement = null;
        this.nameElement = null;

        this.setImgElement(iconTag);
        this.setNameElement(nameTag);
        this.getStatus();

        if (!this.name) {
            this.inferName();
        }
    }

    setImgElement(element) {
        if (!element)
            return;

        const match = element.src.match(charIconRgx);
        this.iconElement = element;
        this.icon = element.src;
        this.key = match.groups.character;

        // set the size after identifying it to prevent larger icons from 
        // causing the frame to grow out of proportion
        switch (match.groups.size) {
            case "small":
                element.height = 24;
                element.width = 24;
                break;
            default:
                element.height = 32;
                element.width = 32;
        }
    }

    setNameElement(element) {
        if (!element)
            return;

        this.nameElement = element;
        this.name = element.textContent;
    }

    // example char urls
    // https://awbw.amarriner.com/terrain/aw1/dsmax.png
    // https://awbw.amarriner.com/terrain/aw1/dseagle.png
    inferName() {
        const match = this.iconElement.src.match(charIconRgx);
        this.name = coNameFromKey(match.groups.character);
    }

    displayCustom(turnOn) {
        this.baseAppearance = turnOn;
        if (turnOn) {
            if (this.iconElement) {
                this.iconElement.title = this.name;

                switch (this.status) {
                    case Status.LOST:
                        this.iconElement.classList.add("co-defeat");
                        break;
                    default:
                        this.iconElement.classList.remove("co-defeat");
                }

                if (this.lostUrl && this.status == Status.LOST) {
                    this.iconElement.src = this.lostUrl;
                } else if (this.customUrl) {
                    this.iconElement.src = this.customUrl;
                } else {
                    this.iconElement.src = this.icon;
                }
            }

            if (this.nameElement) {
                if (this.alias) {
                    this.nameElement.textContent = this.alias;
                } else {
                    this.nameElement.textContent = this.name;
                }
            }
        } else {
            if (this.iconElement) {
                this.iconElement.title = "";
                this.iconElement.src = this.icon;
            }

            if (this.nameElement) {
                this.nameElement.textContent = this.name;
            }
        }
    }

    getStatus() {
        if (!this.iconElement) {
            this.status = Status.UNDEFINED;
            return;
        }

        const match = this.iconElement.src.match(charIconRgx);

        if (!match) {
            this.status = Status.UNDEFINED;
            return;
        }

        switch (match.groups.status) {
            case "gs_":
                this.status = Status.LOST;
                break;
            default:
                this.status = Status.DEFAULT;
        }
    }

    setAlias(alias) {
        this.alias = alias;
    }

    clearAlias() {
        this.alias = "";
    }

    setCustomUrl(url) {
        this.customUrl = url;
    }

    clearCustomUrl() {
        this.customUrl = "";
    }

    setLostUrl(url) {
        this.lostUrl = url;
    }

    clearLostUrl() {
        this.lostUrl = "";
    }

    clearAll() {
        this.clearAlias();
        this.clearCustomUrl();
        this.clearLostUrl();
        this.displayCustom(false);
    }
}

function coNameFromKey(key) {
    switch (key) {
        case "vonbolt":
            return "Von Bolt";
        default:
            return capitalize(key);
    }
}

function coKeyFromName(name) {
    switch (name) {
        case "Von Bolt":
            name = name.replace(/\s/g, "");
        default:
            return name.toLowerCase();
    }
}

function getCOs(iconSelector, nameSelector, parentSelector) {
    if (parentSelector) {
        const parentElements = document.querySelectorAll(parentSelector);

        for (let i = 0; i < parentElements.length; i++) {
            const parentElement = parentElements[i];
            const iconElement = parentElement.querySelector(iconSelector);
            const nameElement = parentElement.querySelector(nameSelector);

            if (!iconElement || !nameElement)
                continue;

            if ("found" in iconElement.dataset || "preview" in iconElement.dataset)
                continue;

            iconElement.dataset.found = true;

            characters.push(new Character(iconElement, nameElement));
        }
    } else {
        const iconElements = document.querySelectorAll(iconSelector);
        const nameElements = document.querySelectorAll(nameSelector);

        for (let i = 0; i < iconElements.length; i++) {
            const iconElement = iconElements[i];
            const match = iconElement.src.match(charIconRgx);

            if (!match || !coNames.includes(match.groups.character))
                continue;

            if ("found" in iconElement.dataset || "preview" in iconElement.dataset)
                continue;

            iconElement.dataset.found = true;

            characters.push(new Character(iconElement));
        }

        for (let i = 0; i < nameElements.length; i++) {
            const nameElement = nameElements[i];
            characters.push(new Character(null, nameElement));
        }
    }
}

function searchCOs() {
    // https://awbw.amarriner.com/index.php                 // Frontpage
    getCOs('.do-game-co-image > img[border="1"]');
    // https://awbw.amarriner.com/co.php                    // CO list
    getCOs("td > a + img", "td > a > b", "table > tbody > tr");
    // https://awbw.amarriner.com/2030.php?games_id=628893  // In match
    getCOs("a.player-co > img");
    // https://awbw.amarriner.com/gamescurrent_all.php      // In current games
    getCOs("#do-game-player-row > img");
    // Catch-all images
    getCOs('img[src$=".png"]');

}

class Settings {
    constructor() {
        this.enabled = false;
        this.window = null;
    }

    async buildWindow() {
        const window = document.createElement("div");
        const wrapper1 = document.createElement("div");
        window.id = "editor-settings";
        this.window = window;
        wrapper1.classList.add("wrapper");

        window.appendChild(wrapper1);

        const saveButton = document.createElement("input");
        const titlebar = document.createElement("div");
        titlebar.id = "editor-title";
        titlebar.innerText = "Display editor";
        saveButton.id = "save-settings";
        saveButton.type = "button";
        saveButton.value = "Save";
        saveButton.onclick = savePersistentData;
        wrapper1.appendChild(titlebar);
        wrapper1.appendChild(saveButton);

        const coCategory = document.createElement("div");
        const coHeader = document.createElement("div");
        const coTable = document.createElement("div");
        const wrapper2 = document.createElement("div");
        coCategory.id = "co-category";
        coTable.id = "co-table";
        coHeader.id = "co-header";
        coHeader.innerText = "CO";
        coHeader.classList.add("header");
        wrapper2.classList.add("wrapper");

        wrapper2.appendChild(coTable);
        coCategory.appendChild(coHeader);
        coCategory.appendChild(wrapper2);
        wrapper1.appendChild(coCategory);

        for (let i = 0; i < coNames.length; i++) {
            const coRow = document.createElement("div");
            const coKey = coNames[i];
            coRow.classList.add("co-row");
            coRow.dataset.coKey = coKey;

            const cell1 = document.createElement("div");
            const icon = document.createElement("img");
            icon.classList.add("base-co-icon");
            icon.dataset.preview = true;
            icon.dataset.src = `https://awbw.amarriner.com/terrain/aw2/ds${coKey}.png`;
            cell1.appendChild(icon);

            const cell2 = document.createElement("div");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.name = "alias";
            nameInput.placeholder = coNameFromKey(coKey);
            cell2.appendChild(nameInput);

            const cell3 = document.createElement("div");
            const urlInput = document.createElement("input");
            urlInput.type = "text";
            urlInput.name = "customUrl";
            urlInput.placeholder = "Icon URL";
            cell3.appendChild(urlInput);

            const cell4 = document.createElement("div");
            const lostInput = document.createElement("input");
            lostInput.type = "text";
            lostInput.name = "lostUrl";
            lostInput.placeholder = "Lost URL";
            cell4.appendChild(lostInput);

            const cells = [cell1, cell2, cell3, cell4];
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                cell.classList.add("co-cell");
                coRow.appendChild(cell);
            }

            coTable.appendChild(coRow);
        }

        this.enabled = await GM.getValue("optionsOpen", false);
        if (!this.enabled) {
            window.classList.add("hidden");
        } else {
            this.loadContent();
        }

        document.body.appendChild(window);
    }

    displayWindow() {
        if (!("fullyLoaded" in this.window.dataset)) {
            this.loadContent();
        }

        this.window.classList.remove("hidden");
        // also remove focus
    }

    hideWindow() {
        this.window.classList.add("hidden");
    }

    async toggleWindow() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.displayWindow();
        } else {
            this.hideWindow();
        }
        await GM.setValue("optionsOpen", this.enabled);
    }

    loadContent() {
        // load icons if window is active
        const icons = this.window.querySelectorAll(".base-co-icon");
        for (let i = 0; i < icons.length; i++) {
            const icon = icons[i];
            icon.src = icon.dataset.src;
        }
        this.window.dataset.fullyLoaded = true;
    }
}

async function loadPersistentData() {
    const data = JSON.parse(await GM.getValue("data", "{}"));

    const rows = settings.window.querySelectorAll(".co-row");
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const inputs = row.querySelectorAll("input");
        const coKey = row.dataset.coKey;
        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];
            input.value = data[coKey][input.name];
        }
    }

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];

        if (!data.hasOwnProperty(char.key))
            continue;

        // console.log(`Working with ${char.name}!`);

        const coData = data[char.key];
        if (coData.alias != "") {
            char.setAlias(coData.alias);
        } else {
            char.clearAlias();
        }

        if (coData.customUrl != "") {
            char.setCustomUrl(coData.customUrl);
        } else {
            char.clearCustomUrl();
        }

        if (coData.lostUrl != "") {
            char.setLostUrl(coData.lostUrl);
        } else {
            char.clearLostUrl();
        }

        if ((char.alias || char.customUrl) || (char.lostUrl && char.state == Status.LOST)) {
            char.displayCustom(true);
        } else {
            char.displayCustom(false);
        }
    }
}

async function savePersistentData() {
    const data = {};
    const rows = settings.window.querySelectorAll(".co-row");
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const inputs = row.querySelectorAll("input");
        const coKey = row.dataset.coKey;
        data[coKey] = {};
        const coData = data[coKey];
        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];
            if (j == 0 && input.value == coNameFromKey(coKey)) {
                input.value = "";
            } else {
                coData[input.name] = input.value;
            }
        }
    }

    await GM.setValue("data", JSON.stringify(data));
    await loadPersistentData();
}

const characters = [];
const settings = new Settings();
let optionKeyPressed = false;

function main() {
    searchCOs();
    settings.buildWindow();
    loadPersistentData();
}

window.addEventListener("keydown", e => {
    if (optionKeyPressed)
        return;

    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
        return;

    if ((e.target instanceof HTMLTextAreaElement) || (e.target instanceof HTMLInputElement))
        return;

    switch (e.code) {
        case "KeyK":
            optionKeyPressed = true;
            settings.toggleWindow();
            break;
    }
});

window.addEventListener("keyup", e => {
    if (!optionKeyPressed)
        return;

    switch (e.code) {
        case "KeyK":
            optionKeyPressed = false;
            break;
    }
})

window.addEventListener("load", main);
