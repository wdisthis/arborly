function parseIndentedText(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return null;

    const root = { name: lines[0].trim(), children: [] };
    const stack = [{ node: root, indent: 0 }];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const indent = line.search(/\S/); // Hitung spasi di depan
        const name = line.trim();
        const newNode = { name: name, children: [] };

        // search for parent node
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        if (stack.length > 0) {
            stack[stack.length - 1].node.children.push(newNode);
        }
        stack.push({ node: newNode, indent: indent });
    }

    return root;
}