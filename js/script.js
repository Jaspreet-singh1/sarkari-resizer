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
                alert('Link copied to clipboard! 📋');
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
    selectBtn.addEventListener('click', () => fileInput.click());

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
                // Optional: Flash fields to show update?
            } else if (e.target.value !== 'custom') {
                // If switching to a non-custom preset that HAS NO dimensions (rare), maybe clear?
                // But for now, let's keep previous values or clearer if we want specific behavior.
                // Better safety: Don't clear if user typed something manually unless they specifically clicked a preset with dims.
            }
        });
    });

    resetBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        editorSection.classList.add('hidden');
        fileInput.value = '';
        currentFile = null;
        window.scrollTo(0, 0);
    });

    // 1. Handle File Selection
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Security: Verify Magic Number (Simple Check)
        verifyImageFile(file).then(isValid => {
            if (!isValid) {
                alert('Invalid file format. Please upload a specific JPEG or PNG image.');
                return;
            }

            currentFile = file;
            const sizeKB = (file.size / 1024).toFixed(2);
            originalSizeText.textContent = `Original: ${sizeKB} KB`;

            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.src = event.target.result;
                originalImage.src = event.target.result;
                editorSection.classList.remove('hidden');
                resultSection.classList.add('hidden'); // bit of cleanup

                // Scroll to editor
                setTimeout(() => {
                    editorSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            };
            reader.readAsDataURL(file);
        });
    }

    // 2. Security: Magic Number Check
    async function verifyImageFile(file) {
        // Read first 4 bytes
        const buffer = await file.slice(0, 4).arrayBuffer();
        const header = new Uint8Array(buffer);
        let headerHex = "";
        for (let i = 0; i < header.length; i++) {
            headerHex += header[i].toString(16).toUpperCase();
        }

        // JPEG: FFD8...
        // PNG: 89504E47
        if (headerHex.startsWith("FFD8")) return true;
        if (headerHex === "89504E47") return true;

        return false;
    }

    // 3. Process Image (Core Logic)
    function processImage() {
        if (!currentFile) return;

        const targetKB = getTargetSize();
        const targetFormat = getTargetFormat();

        compressBtn.textContent = "Processing...";
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
                            format: [originalImage.width, originalImage.height] // Match page size to image
                        });

                        doc.addImage(base64data, 'JPEG', 0, 0, originalImage.width, originalImage.height);
                        const pdfBlob = doc.output('blob');

                        showResult(pdfBlob);
                        compressBtn.textContent = "Resize & Compress";
                        compressBtn.disabled = false;
                    };
                    return;
                }

                const blob = await compressToTarget(originalImage, targetKB, targetFormat);

                if (blob) {
                    showResult(blob);
                } else {
                    alert("Could not compress to that size. The image is too complex.");
                }

            } catch (err) {
                console.error(err);
                alert("An error occurred during processing.");
            }

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

        if (customW && customH) {
            width = customW;
            height = customH;
        } else if (customW) {
            height = Math.round((height * customW) / width);
            width = customW;
        } else if (customH) {
            width = Math.round((width * customH) / height);
            height = customH;
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
        ctx.drawImage(img, 0, 0, width, height);

        let minQ = 0.1;
        let maxQ = 1.0;
        let bestBlob = null;

        // Strategy:
        // If Auto-Resize is ON: We refuse to drop quality below 0.7 (Sharp). If it doesn't fit, we shrink dimensions.
        // If Auto-Resize is OFF: We drop quality as low as needed (down to 0.1) to fit the size.

        let minAcceptableQuality = autoResize ? 0.7 : 0.1;

        // Binary search for quality
        for (let i = 0; i < 7; i++) {
            const midQ = (minQ + maxQ) / 2;
            const blob = await getCanvasBlob(canvas, type, midQ);

            const sizeKB = blob.size / 1024;

            if (sizeKB <= maxKB) {
                bestBlob = blob;
                minQ = midQ;
            } else {
                maxQ = midQ;
            }
        }

        // If Auto-Resize is ON and we didn't find a good blob OR the best blob is too low quality (implied by maxQ dropping)
        // We start shrinking dimensions
        if (autoResize) {
            // Check if our best result so far is actually acceptable in quality?
            // Actually, simply checking if we found a fit isn't enough. We want a fit at HIGH quality.

            // Let's try a smarter loop:
            // If the blob found above is decent quality, great.
            // If we had to drop quality too low to fit, let's reset and resize.

            // Re-eval: Just restart with iterative downscaling if the "Fixed Dimension" attempt didn't yield a high-quality result.
            // Simplified: If (bestBlob is huge OR quality had to go < 0.6), start scaling down.

            // Interactive Downscaling Loop
            let scale = 0.95;
            let attempts = 0;

            // While (File is too big OR Quality is too bad)
            // But we don't know the quality of bestBlob easily.
            // Heuristic: If we couldn't fit it at Q=0.7, we resize.

            // Test Q=0.7 at current size
            const blobHighQ = await getCanvasBlob(canvas, type, 0.7);
            if ((blobHighQ.size / 1024) > maxKB) {
                // It's too big at good quality. Shrink dimensions!
                while (attempts < 20) {
                    const newW = Math.floor(width * scale);
                    const newH = Math.floor(height * scale);

                    if (newW < 200 || newH < 200) break; // Don't go microscopic

                    canvas.width = newW;
                    canvas.height = newH;
                    ctx.drawImage(img, 0, 0, newW, newH);

                    // Try at decent quality (0.75)
                    const blob = await getCanvasBlob(canvas, type, 0.75);
                    if ((blob.size / 1024) <= maxKB) {
                        bestBlob = blob; // Found it!
                        break;
                    }

                    scale -= 0.05;
                    attempts++;
                }
            }
        } else {
            // Logic when Auto-resize is OFF is already handled by the binary search above.
            // It found the best specific quality for the fixed size.
        }

        return bestBlob;
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
        const url = URL.createObjectURL(blob);
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

    document.onkeydown = function (e) {
        // Block F12 (DevTools)
        if (e.code == 'F12') return false;

        // Block Ctrl+U (View Source)
        if (e.ctrlKey && e.code == 'KeyU') return false;

        // Block Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && e.code == 'KeyI') return false;
    }
});
