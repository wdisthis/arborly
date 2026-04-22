// Helper: Generate dynamic filename with timestamp
function generateFilename(extension) {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    return `arborly-${date}-${time}.${extension}`;
}

// Helper function to trigger download
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Common styles for export to ensure visual consistency
const exportStyles = `
    text { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 500; fill: #0f172a; }
    .link { fill: none; stroke: #94a3b8; stroke-width: 1.5px; }
    .node-rect { fill: #f1f5f9; stroke: #cbd5e1; stroke-width: 1px; }
`;

// Helper: Convert SVG to Canvas natively
function svgToCanvas(svgElement, callback) {
    // Ensure namespace exists
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Set style default for export
    const style = document.createElement("style");
    style.innerHTML = exportStyles;
    svgElement.insertBefore(style, svgElement.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    svgElement.removeChild(style); // Clean up style
    
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const width = parseFloat(svgElement.getAttribute("width")) || 1000;
    const height = parseFloat(svgElement.getAttribute("height")) || 1000;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        const canvas = document.createElement("canvas");
        // Use scale 2 for high resolution (Retina)
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        
        // Background white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        callback(canvas);
    };
    img.src = url;
}

// 1. Export PNG
document.getElementById('btn-export-png').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgToCanvas(svgElement, (canvas) => {
        downloadFile(canvas.toDataURL("image/png"), generateFilename('png'));
    });
});

// 2. Export PDF (Vector based)
document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    try {
        const svgElement = document.querySelector('#tree-container svg');
        if (!svgElement) return;

        // Use a clone to avoid styling the actual UI
        const clonedSvg = svgElement.cloneNode(true);
        clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        
        // Embed styles for vector export
        const style = document.createElement("style");
        style.innerHTML = exportStyles;
        clonedSvg.insertBefore(style, clonedSvg.firstChild);

        const width = parseFloat(svgElement.getAttribute("width")) || 1000;
        const height = parseFloat(svgElement.getAttribute("height")) || 1000;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [width, height]
        });

        // Try different ways the library might be exposed
        const svg2pdfFn = window.svg2pdf?.svg2pdf || window.svg2pdf;
        
        if (typeof svg2pdfFn !== 'function') {
            throw new Error("svg2pdf library not loaded correctly");
        }

        await svg2pdfFn(clonedSvg, pdf, {
            x: 0,
            y: 0,
            width: width,
            height: height
        });

        pdf.save(generateFilename('pdf'));
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export PDF: " + err.message);
    }
});

// 3. Export SVG
document.getElementById('btn-export-svg').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Add style before export
    const style = document.createElement("style");
    style.innerHTML = exportStyles;
    svgElement.insertBefore(style, svgElement.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Remove after serialization to avoid cluttering UI
    svgElement.removeChild(style);

    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    downloadFile(url, generateFilename('svg'));
    URL.revokeObjectURL(url);
});

// 4. Export HTML
document.getElementById('btn-export-html').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Arborly Diagram</title>
    <style>
        body {
            margin: 0; padding: 50px;
            background: #ffffff;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh;
        }
        ${exportStyles}
    </style>
</head>
<body>
    ${svgData}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    downloadFile(url, generateFilename('html'));
    URL.revokeObjectURL(url);
});