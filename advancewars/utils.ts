// Injects css to the page
export function addGlobalStyle(css: string) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

// https://stackoverflow.com/a/7224605/7688278
export function capitalize(s: string): string {
    return s && s[0].toUpperCase() + s.slice(1);
}