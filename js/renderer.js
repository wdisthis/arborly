let i = 0;
const MAX_NODE_WIDTH = 280;
const LINE_HEIGHT = 20;
const FONT_STYLE = "500 14px 'Plus Jakarta Sans', sans-serif";

function measureText(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = FONT_STYLE;
    return context.measureText(text).width;
}

function getWrappedLines(text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = [];

    words.forEach(word => {
        const testLine = [...currentLine, word].join(" ");
        if (measureText(testLine) > maxWidth && currentLine.length > 0) {
            lines.push(currentLine.join(" "));
            currentLine = [word];
        } else {
            currentLine.push(word);
        }
    });
    lines.push(currentLine.join(" "));
    return lines;
}

function renderTree(data) {
    const container = document.getElementById('tree-container');
    container.innerHTML = ''; // Clear preview

    if (!data) return;

    const containerSvg = d3.select("#tree-container").append("svg");
    const gElement = containerSvg.append("g");

    // Use nodeSize so distance between nodes is constant
    // Increased vertical spacing to handle multi-line nodes
    const treeLayout = d3.tree().nodeSize([80, 300]); 

    const root = d3.hierarchy(data);
    root.x0 = 0;
    root.y0 = 0;

    function update(source) {
        // Pre-calculate node dimensions before layout to determine spacing
        root.descendants().forEach(d => {
            const lines = getWrappedLines(d.data.name, MAX_NODE_WIDTH);
            d.lines = lines;
            // More generous width calculation
            const textWidth = lines.length > 1 ? MAX_NODE_WIDTH : measureText(lines[0]);
            d.width = Math.max(60, textWidth + 24); 
            d.height = Math.max(36, lines.length * LINE_HEIGHT + 16);
        });

        // Determine dynamic vertical spacing based on the tallest node
        const maxH = d3.max(root.descendants(), d => d.height) || 40;
        const verticalSpacing = Math.max(80, maxH + 40); 
        treeLayout.nodeSize([verticalSpacing, 300]);

        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // Post-process horizontal positions (y) to handle variable node widths
        // Ensure all nodes at the same depth are aligned and don't overlap cousins
        const HORIZONTAL_GAP = 80;
        const depths = d3.groups(root.descendants(), d => d.depth);
        const maxDepth = d3.max(root.descendants(), d => d.depth);
        const levelY = new Array(maxDepth + 1).fill(0);
        const levelMaxWidth = new Array(maxDepth + 1).fill(0);

        depths.forEach(([depth, nodes]) => {
            levelMaxWidth[depth] = d3.max(nodes, d => d.width);
        });

        for (let i = 1; i <= maxDepth; i++) {
            levelY[i] = levelY[i-1] + levelMaxWidth[i-1] + HORIZONTAL_GAP;
        }

        root.each(d => {
            d.y = levelY[d.depth];
        });

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
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('x', 0)
            .attr('y', d => -d.height / 2)
            .attr('height', d => d.height)
            .attr('width', d => d.width)
            .style("fill", d => d._children ? "#e2e8f0" : "#f1f5f9")
            .style("stroke", "#cbd5e1")
            .style("stroke-width", "1px")
            .style("cursor", d => d.children || d._children ? "pointer" : "default")
            .style("box-shadow", "0 1px 2px rgba(0,0,0,0.05)");

        // Add text label with tspan for wrapping
        const textElement = nodeEnter.append('text')
            .attr("x", 10)
            .attr("y", d => -(d.lines.length - 1) * LINE_HEIGHT / 2)
            .attr("dy", "0.35em")
            .style("fill", "#0f172a")
            .style("font-size", "14px")
            .style("font-family", "'Plus Jakarta Sans', sans-serif")
            .style("font-weight", "500")
            .style("cursor", d => d.children || d._children ? "pointer" : "default");

        textElement.selectAll('tspan')
            .data(d => d.lines)
            .enter()
            .append('tspan')
            .attr('x', 10)
            .attr('dy', (d, index) => index === 0 ? "0em" : "1.2em")
            .text(d => d);

        // UPDATE existing nodes
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(500)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select('rect.node-rect')
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('y', d => -d.height / 2)
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
            // Parent box width and height
            const sWidth = s.width || 0;
            // Line starts from parent's vertical center right edge
            const sourceY = s.y + sWidth;
            // Line ends at child's vertical center left edge
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