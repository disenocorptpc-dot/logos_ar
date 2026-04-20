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
                
                // Quitar transparencia de prueba si es necesario (el png transparente se renderizará bien con A-Frame por defecto
                // pero aseguramos con material="transparent: true")
                logoPlane.setAttribute('material', 'transparent: true; alphaTest: 0.5');

                // Recalcular dimensiones
                updateRealWorldDimensions();
            };
            tempImg.src = imgDataUrl;
        };
        reader.readAsDataURL(file);
    });

    // --- Listeners de Interacción ---
    scaleSlider.addEventListener('input', updateRealWorldDimensions);
    markerSizeSelect.addEventListener('change', updateRealWorldDimensions);

    // Init
    updateRealWorldDimensions();
});
