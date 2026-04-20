document.addEventListener("DOMContentLoaded", () => {
    // --- Referencias UI y DOM ---
    const logoUpload = document.getElementById('logo-upload');
    const scaleSlider = document.getElementById('scale-slider');
    const sizeLabel = document.getElementById('size-label');
    
    // --- Referencias A-Frame ---
    const logoWrapper = document.getElementById('logo-wrapper');
    const logoPlane = document.getElementById('logo-plane');

    // --- Variables de Estado ---
    const markerSizeSelect = document.getElementById('marker-size');
    
    // Proporciones iniciales del objeto (A-Frame units)
    let currentPlaneWidth = 1.0;
    let currentPlaneHeight = 1.0;
    let currentScale = 1.0;

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
        sizeLabel.textContent = `${realWidthCm} cm Ancho x ${realHeightCm} cm Alto`;
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
            
            // Crear objeto de imagen temporal para leer sus dimensiones proporcionales
            const tempImg = new Image();
            tempImg.onload = () => {
                const imgWidth = tempImg.width;
                const imgHeight = tempImg.height;
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
                
                // Aplicar la textura (quitar el color sólido y poner el src)
                logoPlane.removeAttribute('color');
                logoPlane.setAttribute('src', imgDataUrl);
                
                // Quitar transparencia forzada (solo mantenemos transparent:true por el PNG)
                logoPlane.setAttribute('material', 'transparent: true;');

                // Recalcular dimensiones
                updateRealWorldDimensions();
            };
            tempImg.src = imgDataUrl;
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
