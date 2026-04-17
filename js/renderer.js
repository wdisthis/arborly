function renderTree(data) {
    const container = document.getElementById('tree-container');
    container.innerHTML = ''; // Clear preview

    if (!data) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    const svg = d3.select("#tree-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(50, 50)");

    const treeLayout = d3.tree().size([height - 100, width - 200]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    // Links (Garis)
    svg.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Nodes
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle").attr("r", 5);
    node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -13 : 13)
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name);
}