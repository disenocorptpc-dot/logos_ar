document.addEventListener("DOMContentLoaded", () => {
    const logoUpload = document.getElementById('logo-upload');
    const scaleSlider = document.getElementById('scale-slider');
    const sizeLabel = document.getElementById('size-label');
    const bgRemoverSelect = document.getElementById('bg-remover');
    
    // --- Referencias A-Frame ---
    const logoWrapper = document.getElementById('logo-wrapper');
    const logoPlane = document.getElementById('logo-plane');

    // --- Variables de Estado ---
    const markerSizeSelect = document.getElementById('marker-size');
    let currentUploadedImageObj = null;
    
    // Proporciones iniciales del objeto (A-Frame units)
    let currentPlaneWidth = 1.0;
    let currentPlaneHeight = 1.0;
    let currentScale = 1.0;

    /**
     * Procesa la imagen para remover el fondo
     */
    function applyBackgroundRemoval(imageObj, removalType) {
        const canvas = document.createElement('canvas');
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageObj, 0, 0);

        if (removalType !== 'none') {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                if (removalType === 'remove-white' && r > 230 && g > 230 && b > 230) {
                    data[i+3] = 0; // Transparent
                } else if (removalType === 'remove-black' && r < 35 && g < 35 && b < 35) {
                    data[i+3] = 0; // Transparent
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
        return canvas.toDataURL('image/png');
    }

    function processAndApplyImage() {
        if (!currentUploadedImageObj) return;
        const processedDataUrl = applyBackgroundRemoval(currentUploadedImageObj, bgRemoverSelect.value);
        logoPlane.setAttribute('material', 'transparent: true;');
        logoPlane.setAttribute('src', processedDataUrl);
    }
    
    bgRemoverSelect.addEventListener('change', () => {
        if (currentUploadedImageObj) processAndApplyImage();
    });

    /**
     * Calcula e imprime el tamaño real del logo que se fabricará.
     */
    function updateRealWorldDimensions() {
        // Obtenemos la escala actual del Slider
        currentScale = parseFloat(scaleSlider.value);
        
        // Aplicamos la escala al Wrapper 3D
        logoWrapper.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
        
        // Calculamos los cm reales basándonos en el dropdown seleccionado
        const currentMarkerRealWidth = parseFloat(markerSizeSelect.value);
        
        // Lado Real (cm) = Lado Virtual (unidades) * Escala del Wrapper * Tamaño Real del Marcador (cm)
        const realWidthCm = (currentPlaneWidth * currentScale * currentMarkerRealWidth).toFixed(1);
        const realHeightCm = (currentPlaneHeight * currentScale * currentMarkerRealWidth).toFixed(1);
        
        // Actualizamos UI
        sizeLabel.textContent = `${realWidthCm} cm x ${realHeightCm} cm`;

        // --- Actualizamos las "Cotas" (Líneas 3D) ---
        const actualWidthUnits = currentPlaneWidth * currentScale;
        const actualHeightUnits = currentPlaneHeight * currentScale;

        // Factor de multiplicación para mantener proporciones en A-Frame
        const lineOffset = 0.05 * currentScale;
        const textOffset = 0.15 * currentScale;
        const lineThickness = 0.015 * currentScale;

        const cotaBottomLine = document.getElementById('cota-bottom-line');
        const cotaBottomText = document.getElementById('cota-bottom-text');
        const cotaRightLine = document.getElementById('cota-right-line');
        const cotaRightText = document.getElementById('cota-right-text');

        if (cotaBottomLine && cotaRightLine) {
            // Línea inferior (Ancho)
            cotaBottomLine.setAttribute('geometry', `primitive: plane; width: ${actualWidthUnits}; height: ${lineThickness}`);
            cotaBottomLine.setAttribute('position', `0 ${-(actualHeightUnits/2) - lineOffset} 0.11`);
            
            cotaBottomText.setAttribute('value', `${realWidthCm} cm`);
            cotaBottomText.setAttribute('position', `0 ${-(actualHeightUnits/2) - textOffset} 0.12`);
            cotaBottomText.setAttribute('scale', `${currentScale} ${currentScale} 1`);

            // Línea lateral derecha (Alto)
            cotaRightLine.setAttribute('geometry', `primitive: plane; width: ${lineThickness}; height: ${actualHeightUnits}`);
            cotaRightLine.setAttribute('position', `${(actualWidthUnits/2) + lineOffset} 0 0.11`);
            
            cotaRightText.setAttribute('value', `${realHeightCm} cm`);
            cotaRightText.setAttribute('position', `${(actualWidthUnits/2) + textOffset} 0 0.12`);
            cotaRightText.setAttribute('scale', `${currentScale} ${currentScale} 1`);
        }
    }

    /**
     * Maneja la subida del logotipo.
     */
    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imgDataUrl = event.target.result;
            
            currentUploadedImageObj = new Image();
            currentUploadedImageObj.onload = () => {
                const imgWidth = currentUploadedImageObj.width;
                const imgHeight = currentUploadedImageObj.height;
                const aspect = imgWidth / imgHeight;

                // Normalizamos para que el lado más largo mida 1 unidad en A-Frame
                if (imgWidth >= imgHeight) {
                    currentPlaneWidth = 1.0;
                    currentPlaneHeight = 1.0 / aspect;
                } else {
                    currentPlaneHeight = 1.0;
                    currentPlaneWidth = aspect;
                }

                // Ajustar las dimensiones del plano en A-Frame
                logoPlane.setAttribute('width', currentPlaneWidth);
                logoPlane.setAttribute('height', currentPlaneHeight);
                logoPlane.removeAttribute('color');
                
                processAndApplyImage();
                updateRealWorldDimensions();
            };
            currentUploadedImageObj.src = imgDataUrl;
        };
        reader.readAsDataURL(file);
    });

    /**
     * Toma una foto (Screenshot) combinando el feed de cámara, el modelo 3D y el texto del UI
     */
    const screenshotBtn = document.getElementById('screenshot-btn');
    screenshotBtn.addEventListener('click', () => {
        const video = document.querySelector('video');
        const arCanvas = document.querySelector('.a-canvas');
        if (!video || !arCanvas) return;

        // Crear canvas en memoria
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = arCanvas.width;
        captureCanvas.height = arCanvas.height;
        const ctx = captureCanvas.getContext('2d');

        // 1. Dibujar el video de la cámara ajustado (Object-fit: cover)
        const vRatio = captureCanvas.width / video.videoWidth;
        const hRatio = captureCanvas.height / video.videoHeight;
        const ratio  = Math.max(vRatio, hRatio);
        const cx = (captureCanvas.width - video.videoWidth * ratio) / 2;
        const cy = (captureCanvas.height - video.videoHeight * ratio) / 2;
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, cx, cy, video.videoWidth * ratio, video.videoHeight * ratio);

        // 2. Dibujar la capa 3D (AR overlay)
        // TRUCO: Forzamos un render sincrónico del motor WebGL para que el canvas no se pinte negro
        const scene = document.querySelector('a-scene');
        if(scene && scene.renderer) {
            scene.renderer.render(scene.object3D, scene.camera);
        }
        ctx.drawImage(arCanvas, 0, 0);

        // 3. Imprimir el texto de la medida
        ctx.font = "bold 60px sans-serif";
        ctx.fillStyle = "#34D399";
        const sizeText = document.getElementById('size-label').textContent;
        const textWidth = ctx.measureText(sizeText).width;
        
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        
        // Colocamos el texto abajo en la foto
        ctx.fillText(sizeText, (captureCanvas.width - textWidth) / 2, captureCanvas.height - 100);

        // Descargar la imagen
        const dataUrl = captureCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'AR_Proyeccion_Escala.png';
        link.href = dataUrl;
        link.click();
    });

    // --- Listeners de Interacción ---
    scaleSlider.addEventListener('input', updateRealWorldDimensions);
    markerSizeSelect.addEventListener('change', updateRealWorldDimensions);

    // Init
    updateRealWorldDimensions();
});
