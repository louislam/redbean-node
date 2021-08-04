function tokenize(text, tokens) {

    const a = Object.entries(tokens)
        .map(([type, regex]) => {
            // @ts-ignore
            return `(?<${type}>${regex.source})`;
        })
        .join('|');

    const compiledRegex = new RegExp(
        a,
        'yi'
    );

    let index = 0;
    const ast: any[] = [];

    while (index < text.length) {
        compiledRegex.lastIndex = index;
        const result = text.match(compiledRegex);

        if (result !== null) {
            // @ts-ignore
            const [type, text] = Object.entries(result.groups).find(
                ([name, group]) => group !== undefined
            );

            index += text.length;

            if (!type.startsWith('_')) {
                ast.push({type, text});
            }
        } else {
            throw new Error(
                `No matching tokenizer rule found at: [${text.substring(index)}]`
            );
        }
    }

    return ast;
}

export {
    tokenize,
};
