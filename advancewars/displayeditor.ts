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
import { Status, charIconRgx, coNameFromKey, coNames } from './officer';
import { Settings } from './settings';
import { addGlobalStyle } from './utils';
import css from './view.css';

function getCOs(iconSelector: string) {
    const iconElements: NodeListOf<HTMLImageElement> = document.querySelectorAll(iconSelector);
    // const nameElements: NodeListOf<HTMLElement> = document.querySelectorAll(nameSelector);

    for (const iconElement of iconElements) {
        const match = iconElement.src.match(charIconRgx);

        if (!match || !match.groups || !coNames.includes(match.groups.character))
            continue;

        if ("found" in iconElement.dataset || "preview" in iconElement.dataset)
            continue;

        iconElement.dataset.found = "true";

        characters.push(new Character(iconElement));
    }

    // for (let nameElement of nameElements) {
    //     characters.push(new Character(null, nameElement));
    // }
}

function getCOsSpecial(iconSelector: string, nameSelector: string, parentSelector: string) {
    const parentElements = document.querySelectorAll(parentSelector);

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
    const selectors: [string][] = [
        // https://awbw.amarriner.com/index.php                 // Frontpage
        ['.do-game-co-image > img[border="1"]'],
        // https://awbw.amarriner.com/2030.php?games_id=628893  // In match
        ["a.player-co > img"],
        // https://awbw.amarriner.com/gamescurrent_all.php      // In current games
        ["#do-game-player-row > img"],
        // Catch-all images
        ['img[src$=".png"]'],
    ]

    for (const selector of selectors) {
        getCOs(...selector);
    }

    const specialSelectors: [string, string, string][] = [
        // https://awbw.amarriner.com/co.php                    // CO list
        ["td > a + img", "td > a > b", "table > tbody > tr"],
    ];

    for (const selector of specialSelectors) {
        getCOsSpecial(...selector);
    }
}


async function loadPersistentData() {
    const data = JSON.parse(await GM.getValue("data", "{}"));

    if (!settings.window)
        return;

    const rows: NodeListOf<HTMLElement> = settings.window.querySelectorAll(".co-row");
    for (const row of rows) {
        const inputs = row.querySelectorAll("input");
        const coKey = row.dataset.coKey;

        if (!coKey)
            return;

        for (const input of inputs) {
            input.value = data[coKey][input.name];
        }
    }

    for (const char of characters) {

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

    const data: { [key: string]: COSaveData } = {};
    const rows: NodeListOf<HTMLElement> = settings.window.querySelectorAll(".co-row");
    for (const row of rows) {
        const inputs = row.querySelectorAll("input");
        const coKey = row.dataset.coKey;

        if (!coKey)
            continue;

        const coData: COSaveData = { alias: "", customUrl: "", lostUrl: "" };
        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];

            // do not populate the name field if it's saved as the same name
            if (j == 0 && input.value == coNameFromKey(coKey)) {
                input.value = "";
            } else {
                const field = input.name as keyof COSaveData;
                coData[field] = input.value;
            }
        }
        data[coKey] = coData;
    }

    await GM.setValue("data", JSON.stringify(data));
    await loadPersistentData();
}

const characters: Character[] = [];
const settings = new Settings();
let optionKeyPressed = false;

function main() {
    addGlobalStyle(css);
    searchCOs();
    settings.buildWindow(savePersistentData);
    loadPersistentData();
}

window.addEventListener("keydown", e => {
    if (optionKeyPressed)
        return;

    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey)
        return;

    const isTextArea = e.target instanceof HTMLTextAreaElement;
    const isInputElement = e.target instanceof HTMLInputElement;

    if (isTextArea || isInputElement)
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
