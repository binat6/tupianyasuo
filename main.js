// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const compressionSettings = document.getElementById('compressionSettings');
const previewArea = document.getElementById('previewArea');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片文件
let currentFile = null;

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 处理文件上传
function handleFileUpload(file) {
    if (!file.type.match('image.*')) {
        alert('请上传图片文件！');
        return;
    }

    currentFile = file;
    originalSize.textContent = formatFileSize(file.size);

    // 显示原始图片预览
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
        compressionSettings.style.display = 'block';
        previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 压缩图片
async function compressImage() {
    if (!currentFile) return;

    try {
        // 显示加载状态
        compressBtn.disabled = true;
        compressBtn.textContent = '压缩中...';

        // 确保压缩质量在有效范围内
        const quality = Math.min(Math.max(parseInt(qualitySlider.value), 0), 100) / 100;
        
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality,
            initialQuality: quality,
            alwaysKeepResolution: true,
            fileType: currentFile.type,
            strict: false
        };

        // 检查文件大小
        if (currentFile.size > 10 * 1024 * 1024) { // 10MB
            throw new Error('文件大小超过限制，请上传小于10MB的图片');
        }

        console.log('开始压缩，参数：', {
            originalSize: formatFileSize(currentFile.size),
            quality: quality,
            fileType: currentFile.type
        });

        const compressedFile = await imageCompression(currentFile, options);
        
        console.log('压缩完成，结果：', {
            originalSize: formatFileSize(currentFile.size),
            compressedSize: formatFileSize(compressedFile.size),
            compressionRatio: (compressedFile.size / currentFile.size * 100).toFixed(2) + '%'
        });

        // 检查压缩后的文件大小
        if (compressedFile.size >= currentFile.size) {
            throw new Error('压缩后文件大小未减小，请尝试降低压缩质量');
        }

        compressedSize.textContent = formatFileSize(compressedFile.size);

        // 显示压缩后的预览
        const reader = new FileReader();
        reader.onload = (e) => {
            compressedPreview.src = e.target.result;
        };
        reader.readAsDataURL(compressedFile);

        // 保存压缩后的文件用于下载
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedFile);
            link.download = `compressed_${currentFile.name}`;
            link.click();
        };
    } catch (error) {
        console.error('压缩失败:', error);
        alert(error.message || '图片压缩失败，请重试！');
    } finally {
        // 恢复按钮状态
        compressBtn.disabled = false;
        compressBtn.textContent = '开始压缩';
    }
}

// 事件监听器
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#007AFF';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#e0e0e0';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#e0e0e0';
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
});

// 更新质量滑块事件处理
qualitySlider.addEventListener('input', () => {
    const value = Math.min(Math.max(parseInt(qualitySlider.value), 0), 100);
    qualityValue.textContent = value + '%';
    qualitySlider.value = value; // 确保值在范围内
});

compressBtn.addEventListener('click', compressImage);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器是否支持所需的API
    if (!window.FileReader || !window.File || !window.FileList || !window.Blob) {
        alert('您的浏览器不支持文件操作，请使用现代浏览器！');
    }
}); 