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
    // Pastikan namespace ada
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Set style default untuk export
    const style = document.createElement("style");
    style.innerHTML = exportStyles;
    svgElement.insertBefore(style, svgElement.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    svgElement.removeChild(style); // Bersihkan style kembali
    
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const width = parseFloat(svgElement.getAttribute("width")) || 1000;
    const height = parseFloat(svgElement.getAttribute("height")) || 1000;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
        const canvas = document.createElement("canvas");
        // Gunakan scale 2 untuk resolusi tinggi (Retina)
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        
        // Background putih
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
        downloadFile(canvas.toDataURL("image/png"), 'arborly-diagram.png');
    });
});

// 2. Export PDF
document.getElementById('btn-export-pdf').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgToCanvas(svgElement, (canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        // Format ukuran ke px aslinya (bukan scaled)
        const origWidth = canvas.width / 2;
        const origHeight = canvas.height / 2;
        
        const pdf = new jsPDF({
            orientation: origWidth > origHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [origWidth, origHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, origWidth, origHeight);
        pdf.save('arborly-diagram.pdf');
    });
});

// 3. Export SVG
document.getElementById('btn-export-svg').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Tambahkan style sebelum ekspor
    const style = document.createElement("style");
    style.innerHTML = exportStyles;
    svgElement.insertBefore(style, svgElement.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Hapus kembali setelah serialisasi agar tidak mengotori UI
    svgElement.removeChild(style);

    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    downloadFile(url, 'arborly-diagram.svg');
    URL.revokeObjectURL(url);
});

// 4. Export HTML
document.getElementById('btn-export-html').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
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
    
    downloadFile(url, 'arborly-diagram.html');
    URL.revokeObjectURL(url);
});