// Helper function to trigger download
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 1. Export PNG
document.getElementById('btn-export-png').addEventListener('click', () => {
    const container = document.getElementById('tree-container');
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Ambil ukuran asli SVG (tidak terpotong scroll)
    const width = parseFloat(svgElement.getAttribute("width"));
    const height = parseFloat(svgElement.getAttribute("height"));

    // Gunakan elemen SVG langsung agar tidak terpotong oleh overflow container
    html2canvas(svgElement, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        width: width,
        height: height
    }).then(canvas => {
        downloadFile(canvas.toDataURL("image/png"), 'arborly-diagram.png');
    });
});

// 2. Export PDF
document.getElementById('btn-export-pdf').addEventListener('click', () => {
    const container = document.getElementById('tree-container');
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    const width = parseFloat(svgElement.getAttribute("width"));
    const height = parseFloat(svgElement.getAttribute("height"));

    html2canvas(svgElement, {
        backgroundColor: "#1a1a1a",
        scale: 2,
        width: width,
        height: height
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // Buat PDF sesuai ukuran canvas
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('arborly-diagram.pdf');
    });
});

// 3. Export SVG
document.getElementById('btn-export-svg').addEventListener('click', () => {
    const svgElement = document.querySelector('#tree-container svg');
    if (!svgElement) return;

    // Pastikan namespace XML diset
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const svgData = new XMLSerializer().serializeToString(svgElement);
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
            background: #1a1a1a;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh;
        }
        /* Agar tulisan rapi */
        text { font-family: sans-serif; font-size: 14px; }
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