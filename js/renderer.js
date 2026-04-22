let i = 0;

function renderTree(data) {
    const container = document.getElementById('tree-container');
    container.innerHTML = ''; // Clear preview

    if (!data) return;

    const containerSvg = d3.select("#tree-container").append("svg");
    const gElement = containerSvg.append("g");

    // Use nodeSize so distance between nodes is constant
    const treeLayout = d3.tree().nodeSize([60, 250]); 

    const root = d3.hierarchy(data);
    root.x0 = 0;
    root.y0 = 0;

    function update(source) {
        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // Calculate tree bounds for dynamic SVG sizing
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
            if (d.y > y1) y1 = d.y;
            if (d.y < y0) y0 = d.y;
        });

        if (x1 === -Infinity) { x0 = 0; x1 = 0; y0 = 0; y1 = 0; }

        const paddingY = 100;
        const paddingX = 350; // Extra space for long text on the right
        const svgWidth = Math.max(container.clientWidth, y1 - Math.min(0, y0) + paddingX);
        const svgHeight = Math.max(container.clientHeight, x1 - x0 + paddingY);

        containerSvg
            .transition()
            .duration(500)
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        // Center tree vertically and pad left
        const translateY = paddingY / 2 - x0;
        const translateX = 50;
        gElement.transition()
            .duration(500)
            .attr("transform", `translate(${translateX}, ${translateY})`);

        // UPDATE NODES
        const node = gElement.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        // ENTER new nodes
        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on('click', click);

        // Add rounded rectangle container
        nodeEnter.append('rect')
            .attr('class', 'node-rect')
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('x', 0)
            .attr('y', -15)
            .attr('height', 30)
            .attr('width', d => Math.max(50, d.data.name.length * 8 + 20))
            .style("fill", d => d._children ? "#e2e8f0" : "#f1f5f9")
            .style("stroke", "#cbd5e1")
            .style("stroke-width", "1px")
            .style("cursor", d => d.children || d._children ? "pointer" : "default")
            .style("box-shadow", "0 1px 2px rgba(0,0,0,0.05)");

        // Add text label
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", 10)
            .style("fill", "#0f172a")
            .style("font-size", "14px")
            .style("font-family", "'Plus Jakarta Sans', sans-serif")
            .style("font-weight", "500")
            .style("cursor", d => d.children || d._children ? "pointer" : "default")
            .text(d => d.data.name);

        // UPDATE existing nodes
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(500)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select('rect.node-rect')
            .attr('width', d => Math.max(50, d.data.name.length * 8 + 20))
            .style("fill", d => d._children ? "#e2e8f0" : "#f1f5f9");

        // EXIT nodes
        const nodeExit = node.exit().transition()
            .duration(500)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('rect').attr('width', 0).attr('height', 0);
        nodeExit.select('text').style('fill-opacity', 1e-6);

        // UPDATE LINKS
        const link = gElement.selectAll('path.link')
            .data(links, d => d.target.id);

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', d => {
                const o = {x: source.x0, y: source.y0, data: source.data};
                return diagonal(o, o);
            })
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", "1.5");

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(500)
            .attr('d', d => diagonal(d.source, d.target));

        link.exit().transition()
            .duration(500)
            .attr('d', d => {
                const o = {x: source.x, y: source.y, data: source.data};
                return diagonal(o, o);
            })
            .remove();

        // Save positions for next animation
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Create curve from parent's right to child's left
        function diagonal(s, d) {
            // Parent box width
            const rectWidth = (s.data && s.data.name) ? Math.max(50, s.data.name.length * 8 + 20) : 0;
            // Line starts from parent's right edge
            const sourceY = s.y + rectWidth;
            // Line ends at child's left edge
            const targetY = d.y;
            
            return `M ${sourceY} ${s.x}
                    C ${(sourceY + targetY) / 2} ${s.x},
                      ${(sourceY + targetY) / 2} ${d.x},
                      ${targetY} ${d.x}`;
        }

        // Expand/collapse on click
        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }

    update(root);
}