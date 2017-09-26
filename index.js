(function () {
    let accumulator = {};
    let last = '';

    let read = function (accumulator, level) {
        let value = '';

        for (let header in accumulator) {
            value += `${accumulator[header]}.`;

            if (header == level) {
                return `${value} `;
            }
        }

        return `${value} `;
    }

    let hierarchy = function (md, opts) {
        md.renderer.rules.heading_open = function (tokens, idx, something, somethingelse, self) {
            let level = tokens[idx].tag;

            if (last < level) {
                accumulator[level] = 1;
            } else {
                accumulator[level]++;
            }

            last = level;

            var label = tokens[idx + 1];
            if (label.type === 'inline') {
                return `<${level}>${read(accumulator, level)}`;
            } else {
                return `</${level}>`;
            }
        };
    };

    module.exports = hierarchy;
})();