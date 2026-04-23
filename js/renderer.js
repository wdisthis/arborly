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

function renderTree(data, isVertical = false) {
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

        // Determine dynamic spacing based on orientation
        if (isVertical) {
            const maxW = d3.max(root.descendants(), d => d.width) || 100;
            const horizontalSpacing = Math.max(120, maxW + 40); 
            treeLayout.nodeSize([horizontalSpacing, 300]);
        } else {
            const maxH = d3.max(root.descendants(), d => d.height) || 40;
            const verticalSpacing = Math.max(80, maxH + 40); 
            treeLayout.nodeSize([verticalSpacing, 300]);
        }

        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // Post-process horizontal/vertical positions based on orientation
        const GAP = isVertical ? 100 : 80;
        const depths = d3.groups(root.descendants(), d => d.depth);
        const maxDepth = d3.max(root.descendants(), d => d.depth);
        const levelPos = new Array(maxDepth + 1).fill(0);
        const levelMaxDim = new Array(maxDepth + 1).fill(0);

        depths.forEach(([depth, nodes]) => {
            levelMaxDim[depth] = d3.max(nodes, d => isVertical ? d.height : d.width);
        });

        for (let i = 1; i <= maxDepth; i++) {
            levelPos[i] = levelPos[i-1] + levelMaxDim[i-1] + GAP;
        }

        root.each(d => {
            d.y = levelPos[d.depth];
        });

        // Calculate tree bounds for dynamic SVG sizing and translation
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        nodes.forEach(d => {
            const posX = isVertical ? d.x : d.y;
            const posY = isVertical ? d.y : d.x;
            const w = d.width;
            const h = d.height;

            const left = isVertical ? posX - w / 2 : posX;
            const right = isVertical ? posX + w / 2 : posX + w;
            const top = isVertical ? posY : posY - h / 2;
            const bottom = isVertical ? posY + h : posY + h / 2;

            if (left < minX) minX = left;
            if (right > maxX) maxX = right;
            if (top < minY) minY = top;
            if (bottom > maxY) maxY = bottom;
        });

        if (nodes.length === 0) { minX = 0; maxX = 0; minY = 0; maxY = 0; }

        const padding = 100;
        const svgWidth = Math.max(container.clientWidth, maxX - minX + padding * 2);
        const svgHeight = Math.max(container.clientHeight, maxY - minY + padding * 2);

        containerSvg
            .transition()
            .duration(500)
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        // Calculate translation to center the tree and keep it within bounds
        const translateX = (isVertical ? -minX + (svgWidth - (maxX - minX)) / 2 : 50);
        const translateY = (isVertical ? 50 : -minY + (svgHeight - (maxY - minY)) / 2);

        gElement.transition()
            .duration(500)
            .attr("transform", `translate(${translateX}, ${translateY})`);

        // UPDATE NODES
        const node = gElement.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        // ENTER new nodes
        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => isVertical ? `translate(${source.x0},${source.y0})` : `translate(${source.y0},${source.x0})`)
            .on('click', click);

        // Add rounded rectangle container
        nodeEnter.append('rect')
            .attr('class', 'node-rect')
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('x', d => isVertical ? -d.width / 2 : 0)
            .attr('y', d => isVertical ? 0 : -d.height / 2)
            .attr('height', d => d.height)
            .attr('width', d => d.width)
            .style("fill", d => d._children ? "#e2e8f0" : "#f1f5f9")
            .style("stroke", "#cbd5e1")
            .style("stroke-width", "1px")
            .style("cursor", d => d.children || d._children ? "pointer" : "default")
            .style("box-shadow", "0 1px 2px rgba(0,0,0,0.05)");

        // Add text label with tspan for wrapping
        const textElement = nodeEnter.append('text')
            .attr("x", d => isVertical ? 0 : d.width / 2)
            .attr("y", d => {
                const centerOffset = isVertical ? d.height / 2 : 0;
                return centerOffset - (d.lines.length - 1) * LINE_HEIGHT / 2;
            })
            .attr("dy", "0.35em")
            .style("fill", "#0f172a")
            .style("font-size", "14px")
            .style("font-family", "'Plus Jakarta Sans', sans-serif")
            .style("font-weight", "500")
            .style("text-anchor", "middle")
            .style("cursor", d => d.children || d._children ? "pointer" : "default");

        textElement.selectAll('tspan')
            .data(d => d.lines.map(line => ({ line, node: d })))
            .enter()
            .append('tspan')
            .attr('x', d => isVertical ? 0 : d.node.width / 2)
            .attr('dy', (d, index) => index === 0 ? "0em" : "1.2em")
            .text(d => d.line);

        // UPDATE existing nodes
        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(500)
            .attr("transform", d => isVertical ? `translate(${d.x},${d.y})` : `translate(${d.y},${d.x})`);

        nodeUpdate.select('rect.node-rect')
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('x', d => isVertical ? -d.width / 2 : 0)
            .attr('y', d => isVertical ? 0 : -d.height / 2)
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

        // Create curve based on orientation
        function diagonal(s, d) {
            if (isVertical) {
                // Vertical curve (Top to Bottom)
                const sourceX = s.x;
                const sourceY = s.y + s.height;
                const targetX = d.x;
                const targetY = d.y;
                
                return `M ${sourceX} ${sourceY}
                        C ${sourceX} ${(sourceY + targetY) / 2},
                          ${targetX} ${(sourceY + targetY) / 2},
                          ${targetX} ${targetY}`;
            } else {
                // Horizontal curve (Left to Right)
                const sWidth = s.width || 0;
                const sourceY = s.y + sWidth;
                const targetY = d.y;
                
                return `M ${sourceY} ${s.x}
                        C ${(sourceY + targetY) / 2} ${s.x},
                          ${(sourceY + targetY) / 2} ${d.x},
                          ${targetY} ${d.x}`;
            }
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