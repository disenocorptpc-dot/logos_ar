const { OfflineCompiler } = require('mind-ar/dist/mindar-compiler.prod.js');
const fs = require('fs');
const { loadImage } = require('canvas');

async function compile() {
  console.log("Loading image...");
  try {
    const imagePath = "C:\\Users\\rsantarosa\\OneDrive - HOTELERA PALACE RESORTS\\Documentos\\Desarrollos\\Logos AR\\Logos_AR.png";
    const image = await loadImage(imagePath);
    console.log("Image loaded! Initializing compiler...");

    const compiler = new OfflineCompiler();
    
    // El método debe recibir la imagen envuelta en un arreglo
    console.log("Tracking features... (this takes a few seconds)");
    await compiler.compileImageTargets([image], (progress) => {
        console.log(`Progress: ${progress.toFixed(2)}%`);
    });

    console.log("Exporting map buffer...");
    const exportedBuffer = await compiler.exportData();
    
    fs.writeFileSync('targets.mind', exportedBuffer);
    console.log("Done! targets.mind generated.");
  } catch (err) {
    console.error("Error during compilation:", err);
  }
}

compile();
