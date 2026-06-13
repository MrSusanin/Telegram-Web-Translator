// ==UserScript==
// @name         Telegram Web Translator
// @namespace    https://greasyfork.org
// @version      1
// @description  Incoming + outgoing translation for Telegram Web A
// @author       YourName
// @match        https://web.telegram.org/a/*
// @match        https://web.telegram.org/k/*
// @license      MIT
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/582436/Telegram%20Web%20Translator.user.js
// @updateURL https://update.greasyfork.org/scripts/582436/Telegram%20Web%20Translator.meta.js
// ==/UserScript==

(function () {
'use strict';

// =====================
// STYLE
// =====================
const style = document.createElement("style");
style.textContent = `
.trans_container {
    margin-top: 2px;
}
.myTextTransMsg {
    font-size: 12.5px;
    opacity: 0.75;
    display: block;
    color: var(--accent-color, #3390ec); /* Подстраивается под тему TG */
}
.tg-translator-menu-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 36px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    padding: 6px 12px;
    box-sizing: border-box;
    cursor: pointer;
    font: inherit;
}
.tg-translator-menu-item:hover {
    background: rgba(255,255,255,0.06);
}
.tg-translator-menu-item .tgico,
.tg-translator-menu-item .btn-menu-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    vertical-align: middle;
    flex-shrink: 0;
    margin-top: 0;
    position: relative;
    top: 0;
}
.tg-translator-menu-item .btn-menu-item-text {
    display: flex;
    align-items: center;
    line-height: 1.2;
}
`;
document.head.appendChild(style);

// =====================
// SETTINGS
// =====================
let SETTINGS = {
    incomingLang: GM_getValue("incomingLang", "auto"),
    incomingTargetLang: GM_getValue("incomingTargetLang", "ru"),
    outgoingLang: GM_getValue("outgoingLang", "ru"),
    mode: GM_getValue("mode", "append"),
    uiLang: GM_getValue("uiLang", "en")
};

const UI_LABELS = {
    en: {
        btn: "Translator",
        incoming: "Incoming source language",
        incomingTarget: "Incoming target language",
        outgoing: "Outgoing language",
        interface: "Interface language",
        mode: "Mode",
        append: "Append",
        replace: "Replace",
        save: "Save",
        close: "Close"
    },
    ru: {
        btn: "Переводчик",
        incoming: "Язык источника входящих",
        incomingTarget: "Язык перевода входящих",
        outgoing: "Язык исходящих",
        interface: "Язык интерфейса",
        mode: "Режим",
        append: "Добавлять",
        replace: "Заменять",
        save: "Сохранить",
        close: "Закрыть"
    }
};

function loadSettings() {
    SETTINGS.incomingLang = GM_getValue("incomingLang", "auto");
    SETTINGS.incomingTargetLang = GM_getValue("incomingTargetLang", "ru");
    SETTINGS.outgoingLang = GM_getValue("outgoingLang", "ru");
    SETTINGS.mode = GM_getValue("mode", "append");
    SETTINGS.uiLang = GM_getValue("uiLang", "en");
    updateSettingsPanel();
}

let settingsPanel;

function ensureSettingsPanel() {
    if (settingsPanel) return settingsPanel;
    const panel = document.createElement("div");
    panel.id = "tg-translator-settings-panel";
    panel.style.position = "fixed";
    panel.style.top = "12px";
    panel.style.right = "12px";
    panel.style.zIndex = "999999";
    panel.style.background = "var(--background-color, #17212b)";
    panel.style.color = "var(--text-color, #fff)";
    panel.style.border = "1px solid var(--border-color, #2f3640)";
    panel.style.borderRadius = "14px";
    panel.style.boxShadow = "0 8px 22px rgba(0,0,0,0.25)";
    panel.style.padding = "12px";
    panel.style.width = "320px";
    panel.style.display = "none";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:600;">
        <span id="tg-settings-title">Translator</span>
        <button id="tg-settings-close" type="button" style="border:0;background:transparent;color:inherit;cursor:pointer;font-size:16px;">×</button>
      </div>
      <label style="display:block;font-size:12px;opacity:0.88;margin-bottom:4px;" for="tg-settings-incoming">Incoming source language</label>
      <select id="tg-settings-incoming" style="width:100%;margin-bottom:8px;">
        <option value="auto">Auto detect</option><option value="ru">Russian</option><option value="en">English</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="ar">Arabic</option><option value="zh-CN">Chinese</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option>
      </select>
      <label style="display:block;font-size:12px;opacity:0.88;margin-bottom:4px;" for="tg-settings-incoming-target">Incoming target language</label>
      <select id="tg-settings-incoming-target" style="width:100%;margin-bottom:8px;">
        <option value="ru">Russian</option><option value="en">English</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="ar">Arabic</option><option value="zh-CN">Chinese</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option>
      </select>
      <label style="display:block;font-size:12px;opacity:0.88;margin-bottom:4px;" for="tg-settings-outgoing">Outgoing language</label>
      <select id="tg-settings-outgoing" style="width:100%;margin-bottom:8px;">
        <option value="ru">Russian</option><option value="en">English</option><option value="de">German</option><option value="fr">French</option><option value="es">Spanish</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="ar">Arabic</option><option value="zh-CN">Chinese</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="tr">Turkish</option><option value="uk">Ukrainian</option>
      </select>
      <label style="display:block;font-size:12px;opacity:0.88;margin-bottom:4px;" for="tg-settings-interface">Interface language</label>
      <select id="tg-settings-interface" style="width:100%;margin-bottom:8px;">
        <option value="en">English</option><option value="ru">Русский</option>
      </select>
      <label style="display:block;font-size:12px;opacity:0.88;margin-bottom:4px;" for="tg-settings-mode">Mode</label>
      <select id="tg-settings-mode" style="width:100%;margin-bottom:8px;">
        <option value="append">Append</option><option value="replace">Replace</option>
      </select>
      <button id="tg-settings-save" type="button" style="width:100%;border:0;border-radius:10px;padding:8px 10px;background:var(--accent-color,#3390ec);color:#fff;cursor:pointer;">Save</button>
      <button id="tg-donate-btn" type="button"
      style="
      width:100%;
      margin-top:8px;
      border:0;
      border-radius:10px;
      padding:8px 10px;
      background:#ffb020;
      color:#000;
      cursor:pointer;
      font-weight:600;">💰 Donate</button>
    `;
    panel.querySelector("#tg-donate-btn").onclick = () => {
    window.open("https://yoomoney.ru/to/4100119525474481", "_blank");
        
    };
    document.body.appendChild(panel);
    panel.querySelector("#tg-settings-close").onclick = () => panel.style.display = "none";
    panel.querySelector("#tg-settings-save").onclick = () => {
        GM_setValue("incomingLang", panel.querySelector("#tg-settings-incoming").value);
        GM_setValue("incomingTargetLang", panel.querySelector("#tg-settings-incoming-target").value);
        GM_setValue("outgoingLang", panel.querySelector("#tg-settings-outgoing").value);
        GM_setValue("uiLang", panel.querySelector("#tg-settings-interface").value);
        GM_setValue("mode", panel.querySelector("#tg-settings-mode").value);
        loadSettings();
        panel.style.display = "none";
        location.reload();
    };
    settingsPanel = { panel, button: document.getElementById("tg-translator-settings-btn") };
    return settingsPanel;
}

function updateSettingsPanel() {
    const { panel } = ensureSettingsPanel();
    const labels = UI_LABELS[SETTINGS.uiLang] || UI_LABELS.en;
    panel.querySelector("#tg-settings-title").textContent = labels.btn;
    panel.querySelector("#tg-settings-incoming").previousElementSibling.textContent = labels.incoming;
    panel.querySelector("#tg-settings-incoming-target").previousElementSibling.textContent = labels.incomingTarget;
    panel.querySelector("#tg-settings-outgoing").previousElementSibling.textContent = labels.outgoing;
    panel.querySelector("#tg-settings-interface").previousElementSibling.textContent = labels.interface;
    panel.querySelector("#tg-settings-mode").previousElementSibling.textContent = labels.mode;
    panel.querySelector("#tg-settings-mode option[value='append']").textContent = labels.append;
    panel.querySelector("#tg-settings-mode option[value='replace']").textContent = labels.replace;
    panel.querySelector("#tg-settings-save").textContent = labels.save;
    panel.querySelector("#tg-settings-close").textContent = labels.close;
    panel.querySelector("#tg-settings-incoming").value = SETTINGS.incomingLang || "auto";
    panel.querySelector("#tg-settings-incoming-target").value = SETTINGS.incomingTargetLang || "ru";
    panel.querySelector("#tg-settings-outgoing").value = SETTINGS.outgoingLang || "ru";
    panel.querySelector("#tg-settings-interface").value = SETTINGS.uiLang || "en";
    panel.querySelector("#tg-settings-mode").value = SETTINGS.mode || "append";
}

function normalizeLang(code) {
    return String(code || "").trim().toLowerCase().replace(/_/g, '-');
}

function isAutoDetect(code) {
    return normalizeLang(code) === "auto";
}

function labelFor(code) {
    const map = {
        ru: "Russian",
        en: "English",
        de: "German",
        fr: "French",
        es: "Spanish",
        it: "Italian",
        pt: "Portuguese",
        ar: "Arabic",
        'zh-cn': 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        tr: 'Turkish',
        uk: 'Ukrainian'
    };
    return map[normalizeLang(code)] || code || "auto";
}

GM_registerMenuCommand(`Incoming: ${labelFor(SETTINGS.incomingLang)}`, () => {
    const value = prompt("Incoming language (auto/ru/en/de/…):", SETTINGS.incomingLang || "auto");
    if (value !== null) {
        const lang = normalizeLang(value) || "auto";
        GM_setValue("incomingLang", lang);
        SETTINGS.incomingLang = lang;
        location.reload();
    }
});

GM_registerMenuCommand(`Outgoing: ${labelFor(SETTINGS.outgoingLang)}`, () => {
    const value = prompt("Outgoing language (ru/en/de/…):", SETTINGS.outgoingLang || "ru");
    if (value !== null) {
        const lang = normalizeLang(value) || "ru";
        GM_setValue("outgoingLang", lang);
        SETTINGS.outgoingLang = lang;
        location.reload();
    }
});

GM_registerMenuCommand(`Mode: ${SETTINGS.mode === "replace" ? "Replace" : "Append"}`, () => {
    const next = SETTINGS.mode === "append" ? "replace" : "append";
    GM_setValue("mode", next);
    SETTINGS.mode = next;
    location.reload();
});

GM_registerMenuCommand("Reset translator settings", () => {
    GM_setValue("incomingLang", "auto");
    GM_setValue("incomingTargetLang", "ru");
    GM_setValue("outgoingLang", "ru");
    GM_setValue("mode", "append");
    GM_setValue("uiLang", "en");
    location.reload();
});

function injectChatMenuItem(menu) {
    if (!menu || !menu.classList.contains('bottom-left')) return;
    if (menu.querySelector('#tg-translator-menu-item')) return;

    const item = document.createElement('div');
    item.id = 'tg-translator-menu-item';
    item.className = 'btn-menu-item rp-overflow tg-translator-menu-item';
    item.innerHTML = '<span class="tgico btn-menu-item-icon" style="margin-right:4px;">⚙</span><span class="btn-menu-item-text">Translator Settings</span>';
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { panel } = ensureSettingsPanel();
        panel.style.display = 'block';
        updateSettingsPanel();
        const menuButton = document.querySelector('.chat-utils .btn-menu-toggle');
        if (menuButton) menuButton.click();
    }, true);

    menu.appendChild(item);
}

function refreshChatMenuItems() {
    document.querySelectorAll('.btn-menu.bottom-left.active.was-open, .btn-menu.bottom-left.active').forEach(injectChatMenuItem);
}

setInterval(refreshChatMenuItems, 500);
setTimeout(() => { ensureSettingsPanel(); loadSettings(); }, 800);

document.addEventListener('click', (e) => {
    if (e.target.closest('.chat-utils .btn-menu-toggle')) {
        setTimeout(refreshChatMenuItems, 120);
    }
}, true);

// =====================
// TRANSLATE API
// =====================
async function translate(text, target, sourceLang = "auto") {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang || "auto")}&tl=${encodeURIComponent(target || "ru")}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Возвращаем ваш стабильный метод сборки текста
        return data[0].map(x => x[0]).join("");
    } catch (e) {
        console.error("Translation API error:", e);
        return null;
    }
}

// Помощники для защиты ссылок, юзернеймов и хэштегов от перевода
function protectText(text) {
    const map = [];
    let protectedText = text
        .replace(/(https?:\/\/[^\s]+)/g, (match) => { map.push(match); return ` [[LINK_${map.length - 1}]] `; })
        .replace(/(@[a-zA-Z0-9_]+)/g, (match) => { map.push(match); return ` [[TAG_${map.length - 1}]] `; })
        .replace(/(#[^\s#]+)/g, (match) => { map.push(match); return ` [[HASH_${map.length - 1}]] `; });
    return { protectedText, map };
}

function restoreText(text, map) {
    let restored = text;
    map.forEach((original, index) => {
        const regex = new RegExp(`\\[\\[(LINK|TAG|HASH)_${index}\\]\\]`, 'gi');
        restored = restored.replace(regex, original);
    });
    return restored;
}

function getMessageText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('.time, .time-inner, .clearfix').forEach(node => node.remove());
    return (clone.textContent || clone.innerText || '').replace(/\s+/g, ' ').trim();
}

// =====================
// INCOMING TRANSLATION
// =====================
async function translateIncoming(el) {
    const wrapper = el.closest("[data-mid], [data-message-id], .bubble, .message, .bubble-content-wrapper") || el;
    if (!wrapper || wrapper.dataset.translated === "1" || wrapper.dataset.lock === "1") return;

    const text = getMessageText(el);

    if (!text || text.length < 2) return;

    wrapper.dataset.lock = "1";

    try {
        const { protectedText, map } = protectText(text);
        const incomingSource = isAutoDetect(SETTINGS.incomingLang) ? "auto" : normalizeLang(SETTINGS.incomingLang) || "auto";
        const incomingTarget = normalizeLang(SETTINGS.incomingTargetLang) || "ru";
        const translatedRaw = await translate(protectedText, incomingTarget, incomingSource);

        if (!translatedRaw) {
            wrapper.dataset.lock = "0";
            return;
        }

        const translated = restoreText(translatedRaw, map);

        // Умная проверка: если текст после перевода совпадает с исходным, перевод не выводим
        if (text.toLowerCase() === translated.toLowerCase()) {
            wrapper.dataset.translated = "1";
            wrapper.dataset.lock = "0";
            return;
        }

        if (SETTINGS.mode === "replace") {
            el.innerText = translated;
        } else {
            if (wrapper.querySelector(".trans_container")) return;

            const container = document.createElement("div");
            container.className = "trans_container";

            const span = document.createElement("span");
            span.className = "myTextTransMsg";
            span.textContent = translated;

            container.appendChild(span);
            wrapper.appendChild(container);
        }

        wrapper.dataset.translated = "1";
    } catch (e) {
        console.error(e);
        wrapper.dataset.lock = "0";
    }
}

// =====================
// SCANNER (ОПТИМИЗИРОВАННЫЙ)
// =====================
function scan() {
    document.querySelectorAll(".bubble .message.spoilers-container, .bubble .bubble-content .message, .bubble .text-content, .bubble .message-text").forEach(el => {
        if (!el || !el.textContent || !el.textContent.trim()) return;
        translateIncoming(el);
    });
}

let scanTimeout;
const observer = new MutationObserver(() => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scan, 300);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

scan();

// =====================
// REACT UPDATE HELPER
// =====================
function updateReactInputValue(inputEl, value) {
    inputEl.focus();

    inputEl.innerHTML = "";
    const textNode = document.createTextNode(value);
    inputEl.appendChild(textNode);

    const tracker = inputEl._valueTracker;
    if (tracker) {
        tracker.setValue(value);
    }

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
}

// =====================
// OUTGOING HOOK
// =====================
document.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;

    // Ищем поле ввода Telegram Web A
    const input = document.querySelector('#editable-message-text, [contenteditable="true"]');
    if (!input || !input.contains(e.target)) return;

    // Фича 1: Если нажат Ctrl+Enter или Meta+Enter — отправляем оригинальный русский текст без перевода
    if (e.ctrlKey || e.metaKey) {
        return;
    }

    if (e.shiftKey) return;

    const text = input.innerText?.trim();
    if (!text) return;

    // Блокируем стандартную отправку исходного русского текста
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    try {
        // Фича 2: Защищаем ссылки при отправке ваших сообщений
        const { protectedText, map } = protectText(text);
        const translatedRaw = await translate(protectedText, SETTINGS.outgoingLang);
        if (!translatedRaw) return;

        const translated = restoreText(translatedRaw, map);

        // Обновляем React-стейт
        updateReactInputValue(input, translated);

        await new Promise(r => setTimeout(r, 100));

        // Ищем и нажимаем кнопку отправки
        const sendButton =
            document.querySelector('.btn-send') ||
            document.querySelector('[aria-label="Send message"]') ||
            document.querySelector('button[title="Send"]') ||
            document.querySelector('.send-button button');

        if (sendButton) {
            sendButton.click();
        } else {
            input.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
        }

    } catch (err) {
        console.error("Outgoing translation failed:", err);
    }
}, true);

})();
