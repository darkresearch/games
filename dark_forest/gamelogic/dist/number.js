"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumber = void 0;
// smallDec represents the decimals to show for small numbers
const formatNumber = (num, smallDec = 0) => {
    if (num < 1000) {
        if (`${num}` === num.toFixed(0)) {
            return `${num.toFixed(0)}`;
        }
        else {
            return `${num.toFixed(smallDec)}`;
        }
    }
    const suffixes = ['', 'K', 'M', 'B', 'T', 'q', 'Q'];
    let log000 = 0;
    let rem = num;
    while (rem / 1000 >= 1) {
        rem /= 1000;
        log000++;
    }
    if (log000 === 0)
        return `${Math.floor(num)}`;
    if (rem < 10)
        return `${rem.toFixed(1)}${suffixes[log000]}`;
    else if (rem < 100)
        return `${rem.toFixed(1)}${suffixes[log000]}`;
    else if (log000 < suffixes.length)
        return `${rem.toFixed(0)}${suffixes[log000]}`;
    else
        return `${rem.toFixed(0)}E${log000 * 3}`;
};
exports.formatNumber = formatNumber;
//# sourceMappingURL=number.js.map