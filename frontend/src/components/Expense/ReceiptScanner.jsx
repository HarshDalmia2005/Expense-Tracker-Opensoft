import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import './ReceiptScanner.css';

const ReceiptScanner = ({ onScanComplete, onClose }) => {
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [mimeType, setMimeType] = useState('image/jpeg');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be smaller than 10MB');
            return;
        }

        setError(null);
        setMimeType(file.type);

        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
            // Extract base64 data without the data:image/xxx;base64, prefix
            const base64 = e.target.result.split(',')[1];
            setImageBase64(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInput = (e) => {
        handleFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const scanReceipt = async () => {
        if (!imageBase64) return;

        setIsScanning(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ocr/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    image: imageBase64,
                    mimeType: mimeType,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to scan receipt');
            }

            const data = await response.json();
            setScanResult(data.data);
        } catch (err) {
            console.error('OCR scan error:', err);
            setError(err.message || 'Failed to scan receipt. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleUseValues = () => {
        if (scanResult && onScanComplete) {
            onScanComplete(scanResult);
        }
    };

    const resetScanner = () => {
        setImagePreview(null);
        setImageBase64(null);
        setScanResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="scanner-overlay">
            <div className="scanner-modal">
                {/* Header */}
                <div className="scanner-header">
                    <div className="scanner-header__info">
                        <Camera size={20} />
                        <h3>Scan Receipt</h3>
                    </div>
                    <button onClick={onClose} className="scanner-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="scanner-body">
                    {!imagePreview ? (
                        /* Upload Zone */
                        <div
                            className={`scanner-dropzone ${isDragging ? 'scanner-dropzone--active' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileInput}
                                className="scanner-file-input"
                            />
                            <div className="scanner-dropzone__icon">
                                <Upload size={32} />
                            </div>
                            <p className="scanner-dropzone__title">
                                Drop receipt image here or click to upload
                            </p>
                            <p className="scanner-dropzone__subtitle">
                                Supports JPG, PNG, WEBP • Max 10MB
                            </p>
                            <div className="scanner-dropzone__buttons">
                                <button
                                    className="scanner-btn scanner-btn--secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <Image size={16} />
                                    Choose File
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Preview + Results */
                        <div className="scanner-preview">
                            <div className="scanner-preview__image-container">
                                <img
                                    src={imagePreview}
                                    alt="Receipt preview"
                                    className="scanner-preview__image"
                                />
                                {isScanning && (
                                    <div className="scanner-preview__scanning">
                                        <div className="scanner-scanline" />
                                        <div className="scanner-preview__scanning-text">
                                            <Loader2 size={24} className="animate-spin" />
                                            <span>Analyzing receipt...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {scanResult && (
                                <div className="scanner-results">
                                    <div className="scanner-results__header">
                                        <CheckCircle size={18} className="text-green-500" />
                                        <span>Extracted Data</span>
                                        {scanResult.confidence && (
                                            <span className={`scanner-confidence ${scanResult.confidence > 70 ? 'scanner-confidence--high' : 'scanner-confidence--low'}`}>
                                                {scanResult.confidence}% confidence
                                            </span>
                                        )}
                                    </div>
                                    <div className="scanner-results__grid">
                                        <div className="scanner-results__item">
                                            <label>Amount</label>
                                            <span>₹{scanResult.amount}</span>
                                        </div>
                                        <div className="scanner-results__item">
                                            <label>Date</label>
                                            <span>{scanResult.date}</span>
                                        </div>
                                        <div className="scanner-results__item">
                                            <label>Category</label>
                                            <span>{scanResult.category}</span>
                                        </div>
                                        <div className="scanner-results__item">
                                            <label>Payment</label>
                                            <span>{scanResult.paymentMethod}</span>
                                        </div>
                                        <div className="scanner-results__item scanner-results__item--full">
                                            <label>Description</label>
                                            <span>{scanResult.description}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="scanner-error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="scanner-footer">
                    {imagePreview && !scanResult && (
                        <>
                            <button onClick={resetScanner} className="scanner-btn scanner-btn--ghost">
                                Re-upload
                            </button>
                            <button
                                onClick={scanReceipt}
                                disabled={isScanning}
                                className="scanner-btn scanner-btn--primary"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Camera size={16} />
                                        Scan Receipt
                                    </>
                                )}
                            </button>
                        </>
                    )}
                    {scanResult && (
                        <>
                            <button onClick={resetScanner} className="scanner-btn scanner-btn--ghost">
                                Scan Another
                            </button>
                            <button onClick={handleUseValues} className="scanner-btn scanner-btn--primary">
                                <CheckCircle size={16} />
                                Use These Values
                            </button>
                        </>
                    )}
                    {!imagePreview && (
                        <button onClick={onClose} className="scanner-btn scanner-btn--ghost">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptScanner;
