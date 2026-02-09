document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const fileInput = document.getElementById('file-input');
    const selectBtn = document.getElementById('select-btn');
    const dropZone = document.getElementById('drop-zone');
    const editorSection = document.getElementById('editor-section');
    const resultSection = document.getElementById('result-section');
    const imagePreview = document.getElementById('image-preview');
    const originalSizeText = document.getElementById('original-size');
    const compressBtn = document.getElementById('compress-btn');
    const finalSizeText = document.getElementById('final-size-display');
    const downloadLink = document.getElementById('download-link');
    const resetBtn = document.getElementById('reset-btn');
    const customSizeInput = document.getElementById('custom-size-input');
    const sizeRadios = document.getElementsByName('size');

    // State
    let currentFile = null;
    let originalImage = new Image();
    let currentBlobUrl = null; // Track blob URL to prevent memory leaks

    console.log('Sarkari Photo Resizer Loaded');

    // Theme Logic
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');

    // Check preference (Local Storage > System Preference)
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });

    // Share Logic
    const shareBtn = document.getElementById('share-btn');
    const shareMoreBtn = document.getElementById('share-more-btn');

    const handleShare = async () => {
        const shareData = {
            title: 'Sarkari Photo Resizer',
            text: 'Resize photos for Govt Forms, Jobs & Admissions in 1 click! ⚡',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard! 📋', 'success');
            }
        } catch (err) {
            console.log('Share failed:', err);
        }
    };

    shareBtn.addEventListener('click', handleShare);
    if (shareMoreBtn) shareMoreBtn.addEventListener('click', handleShare);

    // Dropdown Logic
    const dropdownBtn = document.getElementById('tools-dropdown-btn');
    const dropdownContent = document.getElementById('tools-dropdown-content');

    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });

        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
    }

    // Event Listeners
    selectBtn.addEventListener('click', () => {
        fileInput.value = ''; // Allow re-selecting the same file
        fileInput.click();
    });

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files; // Update input for consistency
            handleFileSelect({ target: { files: files } });
        }
    }

    fileInput.addEventListener('change', handleFileSelect);

    compressBtn.addEventListener('click', processImage);

    // Toggle Custom Input & Handle Presets
    sizeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');

            // 1. Handle Custom Display
            if (e.target.value === 'custom') {
                customSizeInput.classList.remove('hidden');
            } else {
                customSizeInput.classList.add('hidden');
            }

            // 2. Handle Dimension Presets
            const presetWidth = e.target.dataset.width;
            const presetHeight = e.target.dataset.height;

            if (presetWidth && presetHeight) {
                widthInput.value = presetWidth;
                heightInput.value = presetHeight;

                // Visual feedback (The Best Polish ✨)
                widthInput.classList.remove('flash-update');
                heightInput.classList.remove('flash-update');
                void widthInput.offsetWidth; // Trigger reflow
                widthInput.classList.add('flash-update');
                heightInput.classList.add('flash-update');

            } else if (e.target.value !== 'custom') {
                // If switching to a non-custom preset that HAS NO dimensions (rare), maybe clear?
                // But for now, let's keep previous values or clearer if we want specific behavior.
                // Better safety: Don't clear if user typed something manually unless they specifically clicked a preset with dims.
            }
        });
    });

    // 3. Handle Separate Dimension Presets (New Logic)
    const dimRadios = document.getElementsByName('dim_preset');
    dimRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const widthInput = document.getElementById('width-input');
            const heightInput = document.getElementById('height-input');
            const customSizeInput = document.getElementById('custom-size-input');

            // Handle Custom Dim
            if (e.target.value === 'custom') {
                // Maybe show custom logic if needed, but for dims we usually just edit inputs
            }

            const presetWidth = e.target.dataset.width;
            const presetHeight = e.target.dataset.height;

            if (presetWidth && presetHeight) {
                widthInput.value = presetWidth;
                heightInput.value = presetHeight;

                // Visual feedback
                widthInput.classList.remove('flash-update');
                heightInput.classList.remove('flash-update');
                void widthInput.offsetWidth;
                widthInput.classList.add('flash-update');
                heightInput.classList.add('flash-update');
            }
        });
    });

    resetBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        editorSection.classList.add('hidden');
        document.querySelector('.upload-area').classList.remove('hidden'); // Show Upload Area
        fileInput.value = '';
        currentFile = null;
        window.scrollTo(0, 0);
    });

    // CropperJS variables
    let cropper = null;
    const cropModal = document.getElementById('crop-modal');
    const cropImage = document.getElementById('crop-image');
    const cropConfirmBtn = document.getElementById('crop-confirm-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    let originalFileName = ''; // Store original filename for download
    let croppedBlobUrl = null; // Track cropped image URL to prevent memory leak

    // Handle File Selection (Made Async for validation)
    async function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Security: Verify Magic Number (Simple Check)
        const buffer = await file.slice(0, 4).arrayBuffer();
        const header = new Uint8Array(buffer);
        let headerHex = "";
        for (let i = 0; i < header.length; i++) {
            headerHex += header[i].toString(16).toUpperCase();
        }

        // JPEG: FFD8... PNG: 89504E47...
        let isValid = false;
        if (headerHex.startsWith("FFD8")) isValid = true;
        if (headerHex === "89504E47") isValid = true;

        if (!isValid) {
            showToast('Invalid file. Please upload a specific JPEG or PNG image.', 'error');
            return;
        }

        currentFile = file;
        const sizeKB = (file.size / 1024).toFixed(2);
        originalSizeText.textContent = `Original: ${sizeKB} KB`;

        const reader = new FileReader();
        reader.onload = function (event) {
            // Open Crop Modal instead of Editor immediately
            openCropModal(event.target.result);
        };
        reader.readAsDataURL(file);
    }

    function openCropModal(imageSrc) {
        // Check if Cropper.js library is loaded
        if (typeof Cropper === 'undefined') {
            showToast('Cropper.js failed to load. Please disable ad blockers.', 'error');
            cropModal.classList.remove('hidden');
            const loadingText = document.getElementById('crop-loading');
            if (loadingText) loadingText.textContent = 'ERROR: Cropper.js library not loaded. Please disable ad blockers.';
            return;
        }

        // Show Modal, Hide Upload Area
        cropModal.classList.remove('hidden');
        document.querySelector('.upload-area').classList.add('hidden');

        // Show loading text
        const loadingText = document.getElementById('crop-loading');
        if (loadingText) {
            loadingText.style.display = 'block';
            loadingText.textContent = 'Loading image...';
        }

        // Destroy previous cropper if exists
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        // Set image source
        cropImage.src = imageSrc;

        // CRITICAL: Wait for image to load before initializing Cropper
        cropImage.onload = function () {
            if (loadingText) loadingText.textContent = 'Initializing crop tool...';

            try {
                // Initialize Cropper with proper settings
                cropper = new Cropper(cropImage, {
                    viewMode: 1,              // Restrict crop box to image bounds
                    dragMode: 'crop',         // 'crop' allows moving crop box
                    autoCropArea: 0.9,        // 90% initial crop
                    responsive: true,         // Auto-resize on window change
                    restore: false,
                    guides: true,             // Show grid lines
                    center: true,             // Show center indicator
                    highlight: true,          // Show highlighted crop area
                    cropBoxMovable: true,     // Allow crop box dragging
                    cropBoxResizable: true,   // Allow crop box resizing
                    toggleDragModeOnDblclick: false,
                    minContainerHeight: 300,
                    background: true,         // Show grid background
                    modal: true,              // Show black modal above image
                    zoomable: true,           // Enable zoom
                    zoomOnWheel: true,        // Zoom with mouse wheel
                    zoomOnTouch: true,        // Zoom with pinch on mobile
                    ready: function () {
                        // This fires when Cropper is fully ready
                        if (loadingText) loadingText.style.display = 'none';
                        showToast('Crop tool ready! Drag corners to adjust.', 'success');
                    }
                });

            } catch (error) {
                console.error('Failed to initialize Cropper:', error);
                showToast('Error initializing crop tool.', 'error');
                if (loadingText) loadingText.textContent = 'Failed to load crop tool: ' + error.message;
            }
        };

        cropImage.onerror = function () {
            console.error('Failed to load image');
            showToast('Failed to load image. Please try again.', 'error');
            if (loadingText) loadingText.textContent = 'Failed to load image';
        };
    }


    // Rotate Button  
    rotateBtn.addEventListener('click', () => {
        console.log('Rotate button clicked, cropper:', cropper);
        if (cropper) {
            cropper.rotate(90);
            console.log('Image rotated 90 degrees');
            // Visual confirmation without needing console
            rotateBtn.textContent = '✓ Rotated';
            setTimeout(() => {
                rotateBtn.textContent = 'Rotate 90° ↻';
            }, 1000);
        } else {
            console.error('Cropper not initialized!');
            showToast('Cropper not ready yet.', 'error');
        }
    });

    // Confirm Crop
    cropConfirmBtn.addEventListener('click', () => {
        if (!cropper) return;

        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            maxWidth: 4096,
            maxHeight: 4096,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!canvas) return;

        // Convert to Blob and load into Editor
        canvas.toBlob((blob) => {
            // Revoke previous cropped URL to free memory
            if (croppedBlobUrl) {
                URL.revokeObjectURL(croppedBlobUrl);
            }

            croppedBlobUrl = URL.createObjectURL(blob);
            const url = croppedBlobUrl;

            // Load into Main Editor
            originalImage.src = url;
            imagePreview.src = url;

            // Set Quality defaults (if not set)
            // qualitySlider logic if needed, currently implied by processImage default

            // Show Editor, Hide Modal
            cropModal.classList.add('hidden');
            editorSection.classList.remove('hidden');
            resultSection.classList.add('hidden');

            // Scroll to Editor
            setTimeout(() => {
                editorSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);

            // Clean up
            cropper.destroy();
            cropper = null;

            // Don't auto-compress - let user select presets first
            // User can manually click "Resize & Compress" button when ready

        }, 'image/jpeg', 1.0); // High quality intermediate
    });

    // 3. Process Image (Core Logic)
    function processImage() {
        if (!originalImage.src) return;

        const targetKB = getTargetSize();
        const targetFormat = getTargetFormat();

        // New Loading State
        compressBtn.classList.add('btn-loading'); // Add spinner
        compressBtn.textContent = ""; // Hide text
        compressBtn.disabled = true;

        // Use setTimeout to allow UI update
        setTimeout(async () => {
            try {
                if (targetFormat === 'application/pdf') {
                    // Compress image first to target size (as JPEG)
                    const tempBlob = await compressToTarget(originalImage, targetKB, 'image/jpeg');

                    if (!tempBlob) {
                        throw new Error("Could not compress image enough for PDF.");
                    }

                    // Convert Blob to Data URL
                    const reader = new FileReader();
                    reader.readAsDataURL(tempBlob);
                    reader.onloadend = () => {
                        const base64data = reader.result;

                        // Create PDF
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF({
                            orientation: originalImage.width > originalImage.height ? 'l' : 'p',
                            unit: 'px',
                            format: [originalImage.width, originalImage.height]
                        });

                        doc.addImage(base64data, 'JPEG', 0, 0, originalImage.width, originalImage.height);
                        const pdfBlob = doc.output('blob');

                        showResult(pdfBlob);

                        // Reset Button
                        compressBtn.classList.remove('btn-loading');
                        compressBtn.textContent = "Resize & Compress";
                        compressBtn.disabled = false;
                    };
                    return;
                }

                const blob = await compressToTarget(originalImage, targetKB, targetFormat);

                if (blob) {
                    showResult(blob);
                } else {
                    showToast("Could not compress to that size. Image too complex.", 'error');
                }

            } catch (err) {
                console.error(err);
                showToast("An error occurred during processing.", 'error');
            }

            // Reset Button (Common exit)
            compressBtn.classList.remove('btn-loading');
            compressBtn.textContent = "Resize & Compress";
            compressBtn.disabled = false;
        }, 100);
    }

    // 4. Binary Search Compression Logic
    async function compressToTarget(img, maxKB, type) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const autoResize = document.getElementById('auto-resize-check').checked;

        // Initial Dimensions
        let width = img.width;
        let height = img.height;

        // Check for Custom Dimensions
        const customW = parseInt(document.getElementById('width-input').value);
        const customH = parseInt(document.getElementById('height-input').value);

        // Validate dimensions - ignore NaN values
        const validCustomW = !isNaN(customW) && customW > 0 ? customW : 0;
        const validCustomH = !isNaN(customH) && customH > 0 ? customH : 0;

        if (validCustomW && validCustomH) {
            width = validCustomW;
            height = validCustomH;
        } else if (validCustomW) {
            height = Math.round((height * validCustomW) / width);
            width = validCustomW;
        } else if (validCustomH) {
            width = Math.round((width * validCustomH) / height);
            height = validCustomH;
        } else {
            // Optimization: Cap max dimension to 1200px (Sufficient for forms)
            const MAX_DIMENSION = 1200;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }
        }

        canvas.width = width;
        canvas.height = height;

        // High Quality + Sharpening Trick
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Adaptive Sharpening based on Scale Factor
        // If we are Upscaling (scale > 1), we need MORE sharpening to fix blur.
        // If we are Downscaling (scale < 1), we need LESS sharpening to avoid aliasing artifacts.

        const srcArea = img.width * img.height;
        const dstArea = width * height;
        const scale = Math.sqrt(dstArea / srcArea);

        let sharpenAmount = 0.20; // Default

        if (scale > 1.2) {
            sharpenAmount = 0.35; // Stronger for Upscaling
        } else if (scale < 0.5) {
            sharpenAmount = 0.12; // Softer for heavy downscaling
        }

        sharpenCanvas(ctx, width, height, sharpenAmount);

        let minQ = 0.1;
        let maxQ = 1.0;
        let bestBlob = null;

        // Strategy:
        // We prefer a smaller, high-quality image over a large, pixelated one.
        // If Auto-Resize is ON: We refuse to drop quality below 0.6 (Sharp). 

        let minAcceptableQuality = autoResize ? 0.6 : 0.1;

        // Binary search for quality -- but only down to minAcceptableQuality
        for (let i = 0; i < 7; i++) {
            const midQ = (minQ + maxQ) / 2;

            // If we are below acceptable quality and auto-resize is on, stop searching low quality
            if (autoResize && midQ < minAcceptableQuality) {
                minQ = midQ;
                continue;
            }

            const blob = await getCanvasBlob(canvas, type, midQ);
            const sizeKB = blob.size / 1024;

            if (sizeKB <= maxKB) {
                bestBlob = blob;
                minQ = midQ;
            } else {
                maxQ = midQ;
            }
        }

        // If Auto-Resize is ON and we didn't find a good blob OR the best blob is too low quality
        if (autoResize) {
            const currentBlobSize = bestBlob ? bestBlob.size / 1024 : 99999;
            // If we failed to find a blob, OR the best one we found is still too big
            if (!bestBlob || currentBlobSize > maxKB) {

                // Smart Scaling Loop: Shrink dimensions until we fit at HIGH quality (0.7)
                let resizeScale = 0.95; // Renamed to avoid shadowing outer 'scale' variable
                let attempts = 0;

                while (attempts < 20) {
                    const newW = Math.floor(width * resizeScale);
                    const newH = Math.floor(height * resizeScale);

                    if (newW < 200 || newH < 200) break; // Don't go microscopic

                    canvas.width = newW;
                    canvas.height = newH;

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, 0, 0, newW, newH);
                    sharpenCanvas(ctx, newW, newH, 0.25); // Slightly stronger sharpen for smaller images

                    // Try at decent quality (0.75)
                    const blob = await getCanvasBlob(canvas, type, 0.75);
                    if ((blob.size / 1024) <= maxKB) {
                        bestBlob = blob; // Found it!
                        break;
                    }

                    resizeScale -= 0.05;
                    attempts++;
                }
            }
        } else {
            // Logic when Auto-resize is OFF is already handled by the binary search above.
        }

        return bestBlob;
    }

    // New Sharpening Function (Convolution Filter)
    function sharpenCanvas(ctx, w, h, mix) {
        try {
            const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            const katet = Math.round(Math.sqrt(weights.length));
            const half = (katet * 0.5) | 0;
            const dstData = ctx.createImageData(w, h);
            const dstBuff = dstData.data;
            const srcBuff = ctx.getImageData(0, 0, w, h).data;
            let y = h;

            while (y--) {
                let x = w;
                while (x--) {
                    const sy = y;
                    const sx = x;
                    const dstOff = (y * w + x) * 4;
                    let r = 0, g = 0, b = 0, a = 0;

                    for (let cy = 0; cy < katet; cy++) {
                        for (let cx = 0; cx < katet; cx++) {
                            const scy = sy + cy - half;
                            const scx = sx + cx - half;
                            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                                const srcOff = (scy * w + scx) * 4;
                                const wt = weights[cy * katet + cx];
                                r += srcBuff[srcOff] * wt;
                                g += srcBuff[srcOff + 1] * wt;
                                b += srcBuff[srcOff + 2] * wt;
                                a += srcBuff[srcOff + 3] * wt;
                            }
                        }
                    }

                    dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
                    dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
                    dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix);
                    dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
                }
            }
            ctx.putImageData(dstData, 0, 0);
        } catch (error) {
            // Handle tainted canvas (cross-origin image) - skip sharpening
            console.warn('Sharpening skipped due to canvas security restriction:', error);
        }
    }

    function getCanvasBlob(canvas, type, quality) {
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), type, quality);
        });
    }

    function getTargetSize() {
        // First check custom input
        for (let radio of sizeRadios) {
            if (radio.checked) {
                if (radio.value === 'custom') {
                    const val = parseInt(customSizeInput.value);
                    return (val && val > 0) ? val : 50; // Default to 50 if invalid
                }
                return parseInt(radio.value);
            }
        }
        return 50;
    }

    function getTargetFormat() {
        const radios = document.getElementsByName('format');
        for (let radio of radios) {
            if (radio.checked) return radio.value;
        }
        return 'image/jpeg';
    }

    function showResult(blob) {
        // Revoke previous URL to free memory
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }

        currentBlobUrl = URL.createObjectURL(blob);
        const url = currentBlobUrl;
        const sizeKB = (blob.size / 1024).toFixed(2);

        finalSizeText.textContent = `New Size: ${sizeKB} KB`;
        downloadLink.href = url;

        // Show Compressed Preview
        document.getElementById('result-image').src = url;

        // Update extension based on type
        const type = getTargetFormat();
        let ext = 'jpg';
        if (type === 'image/png') ext = 'png';
        if (type === 'application/pdf') ext = 'pdf';

        downloadLink.download = `compressed_image.${ext}`;

        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 5. Anti-Theft / Copy Protection
    document.addEventListener('contextmenu', event => event.preventDefault()); // Block Right Click

    // Toast Notification System
    function showToast(message, type = 'default') {
        // Create container if not exists
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        container.appendChild(toast);

        // Remove after 3s
        setTimeout(() => {
            toast.style.animation = 'fadeOutDown 0.3s ease-out forwards';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3500);
    }
});
