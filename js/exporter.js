document.getElementById('btn-export').addEventListener('click', () => {
    const container = document.getElementById('tree-container');
    
    html2canvas(container, {
        backgroundColor: "#1a1a1a", // Samakan dengan CSS
        scale: 2 // Agar hasil tidak pecah
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'arborly-diagram.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});