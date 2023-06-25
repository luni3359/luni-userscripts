// ==UserScript==
// @name            AWBW: Display Editor
// @description     Press K to edit the appearance of any CO
// @version         1.8.0
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
import { Character } from './character';
import { CoKey, Status, charIconRgx, coNameFromKey, coNames } from './officer';
import { Settings } from './settings';
import { addGlobalStyle } from './utils';
import css from './styles/view.scss';

function getCOs(iconSelector: string) {
    const iconElements: NodeListOf<HTMLImageElement> = document.querySelectorAll(iconSelector);
    
    for (const iconElement of iconElements) {
        const match = iconElement.src.match(charIconRgx);

        if (!match?.groups?.character || !coNames.includes(match.groups.character as CoKey))
            continue;

        if ("found" in iconElement.dataset || "preview" in iconElement.dataset)
            continue;

        iconElement.dataset.found = "true";

        characters.push(new Character(iconElement));
    }
}

function getCOsSpecial(iconSelector: string, nameSelector: string, parentSelector: string) {
    const parentElements: NodeListOf<HTMLTableRowElement> = document.querySelectorAll(parentSelector);

    for (const parentElement of parentElements) {
        const iconElement: HTMLImageElement | null = parentElement.querySelector(iconSelector);
        const nameElement: HTMLElement | null = parentElement.querySelector(nameSelector);

        if (!iconElement || !nameElement)
            continue;

        if ("found" in iconElement.dataset || "preview" in iconElement.dataset)
            continue;

        iconElement.dataset.found = "true";

        characters.push(new Character(iconElement, nameElement));
    }
}

function searchCOs() {
    const specialSelectors: [string, string, string][] = [
        // https://awbw.amarriner.com/co.php                    // CO list
        ["td > a + img", "td > a > b", "table > tbody > tr"],
    ];

    for (const selector of specialSelectors) {
        getCOsSpecial(...selector);
    }

    const selectors: [string][] = [
        // https://awbw.amarriner.com/index.php                 // Frontpage
        ['.do-game-co-image > img[border="1"]'],
        // https://awbw.amarriner.com/2030.php?games_id=628893  // In match, new interface, icons only
        ["a.player-co > img"],
        // https://awbw.amarriner.com/gamescurrent_all.php      // In current games
        ["#do-game-player-row > img"],

        /* new ones */
        // https://awbw.amarriner.com/game.php?games_id=810030  // old interface, icons only
        ['img.co_portrait'],
        ['img.co_portrait_small'],
    ]

    for (const selector of selectors) {
        getCOs(...selector);
    }
}


async function loadPersistentData() {
    const data: Record<CoKey, Partial<COSaveData>> = JSON.parse(await GM.getValue("data", "{}"));

    if (!settings.window)
        return;

    const rows: NodeListOf<HTMLElement> = settings.window.querySelectorAll(".co-row");
    for (const row of rows) {
        const inputFields: NodeListOf<HTMLInputElement> = row.querySelectorAll("input");
        const coKey = row.dataset.coKey as CoKey | undefined;

        if (!coKey || !Object.hasOwn(data, coKey))
            continue;

        for (const inputField of inputFields) {
            const coData = data[coKey];
            const inputName = inputField.name as keyof COSaveData;

            if (coData[inputName] != undefined)
                inputField.value = coData[inputName]!;
        }
    }

    for (const char of characters) {
        if (!char.key || !Object.hasOwn(data, char.key)) {
            char.clearAll();
            continue;
        }

        const coData = data[char.key];
        if (coData.alias && coData.alias != "") {
            char.setAlias(coData.alias);
        } else {
            char.clearAlias();
        }

        if (coData.customUrl && coData.customUrl != "") {
            char.setCustomUrl(coData.customUrl);
        } else {
            char.clearCustomUrl();
        }

        if (coData.lostUrl && coData.lostUrl != "") {
            char.setLostUrl(coData.lostUrl);
        } else {
            char.clearLostUrl();
        }

        const hasAliasOrUrl = char.alias || char.customUrl;
        const defeatedWithUrl = char.lostUrl && char.status == Status.LOST;

        if (hasAliasOrUrl || defeatedWithUrl) {
            char.displayCustom(true);
        } else {
            char.displayCustom(false);
        }
    }
}

async function savePersistentData() {
    if (!settings.window)
        return;

    const data: { [key: string]: Partial<COSaveData> } = {};
    const rows: NodeListOf<HTMLElement> = settings.window.querySelectorAll(".co-row");
    for (const row of rows) {
        const inputFields: NodeListOf<HTMLInputElement> = row.querySelectorAll("input");
        const coKey = row.dataset.coKey as CoKey | undefined;

        if (!coKey)
            continue;

        const coData: Partial<COSaveData> = {};
        for (const inputField of inputFields) {
            const inputName = inputField.name as keyof COSaveData;
            if (inputName == 'alias' && inputField.value == coNameFromKey(coKey)) {
                // do not populate the alias field if the alias is the same as the name
                inputField.value = "";
            } else if (inputField.value != "") {
                coData[inputName] = inputField.value;
            }
        }

        if (Object.getOwnPropertyNames(coData).length != 0) {
            data[coKey] = coData;
        }
    }

    await GM.setValue("data", JSON.stringify(data));
    await loadPersistentData();
}

const characters: Character[] = [];
const settings = new Settings();
let isHoldingSettingsKey = false;

function main() {
    addGlobalStyle(css);
    searchCOs();
    settings.buildWindow(savePersistentData);
    loadPersistentData();
}

window.addEventListener("keydown", e => {
    if (isHoldingSettingsKey)
        return;

    const isPressingModKey = e.altKey || e.ctrlKey || e.shiftKey || e.metaKey;
    if (isPressingModKey)
        return;

    const isTextArea = e.target instanceof HTMLTextAreaElement;
    const isInputElement = e.target instanceof HTMLInputElement;

    if (isTextArea || isInputElement)
        return;

    switch (e.code) {
        case "KeyK":
            isHoldingSettingsKey = true;
            settings.toggleWindow();
            break;
    }
});

window.addEventListener("keyup", e => {
    if (!isHoldingSettingsKey)
        return;

    switch (e.code) {
        case "KeyK":
            isHoldingSettingsKey = false;
            break;
    }
})

window.addEventListener("load", main);
