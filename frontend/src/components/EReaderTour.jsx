import { useState, useEffect } from 'react';

export default function EReaderTour({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const steps = [
        {
            target: '[data-tour="close-button"]',
            title: 'Close Reader',
            description: 'Click here to close the book and return to your library',
            placement: 'bottom'
        },
        {
            target: '[data-tour="toc-button"]',
            title: 'Table of Contents',
            description: 'View chapters and navigate quickly through the book',
            placement: 'bottom'
        },
        {
            target: '[data-tour="annotations-button"]',
            title: 'Notes & Highlights',
            description: 'Access all your notes and highlights for this book',
            placement: 'bottom'
        },
        {
            target: '[data-tour="settings-button"]',
            title: 'Reading Settings',
            description: 'Adjust font size, theme, and other reading preferences',
            placement: 'bottom'
        },
        {
            target: '[data-tour="prev-button"]',
            title: 'Previous Page',
            description: 'Navigate to the previous page',
            placement: 'top'
        },
        {
            target: '[data-tour="next-button"]',
            title: 'Next Page',
            description: 'Navigate to the next page',
            placement: 'top'
        }
    ];

    useEffect(() => {
        if (currentStep < steps.length) {
            updatePosition();

            // Update position on window resize or scroll
            const handleUpdate = () => updatePosition();
            window.addEventListener('resize', handleUpdate);
            window.addEventListener('scroll', handleUpdate, true);

            return () => {
                window.removeEventListener('resize', handleUpdate);
                window.removeEventListener('scroll', handleUpdate, true);
            };
        }
    }, [currentStep]);

    const updatePosition = () => {
        const step = steps[currentStep];
        const element = document.querySelector(step.target);

        if (element) {
            const rect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = Math.min(384, viewportWidth - 32); // max-w-sm with padding
            const modalHeight = 250; // approximate height
            const padding = 16;

            let top, left;

            if (step.placement === 'bottom') {
                top = rect.bottom + 20;
                left = rect.left + rect.width / 2;

                // Check if modal would overflow bottom
                if (top + modalHeight > viewportHeight) {
                    top = rect.top - modalHeight - 20;
                }
            } else if (step.placement === 'top') {
                // For top placement, center the modal vertically relative to button
                top = rect.top + rect.height / 2 - modalHeight / 2;
                left = rect.left + rect.width / 2;

                // If it would overflow top, move it down
                if (top < padding) {
                    top = padding;
                }
            } else if (step.placement === 'right') {
                top = rect.top + rect.height / 2 - modalHeight / 2;
                left = rect.right + 20;
            } else {
                top = rect.top + rect.height / 2 - modalHeight / 2;
                left = rect.left - modalWidth - 20;
            }

            // Ensure modal doesn't overflow horizontally
            const halfModalWidth = modalWidth / 2;
            if (left - halfModalWidth < 16) {
                left = halfModalWidth + 16;
            } else if (left + halfModalWidth > viewportWidth - 16) {
                left = viewportWidth - halfModalWidth - 16;
            }

            // Ensure modal doesn't overflow vertically
            if (top < 16) {
                top = 16;
            } else if (top + modalHeight > viewportHeight - 16) {
                top = Math.max(16, viewportHeight - modalHeight - 16);
            }

            setPosition({ top, left });

            // Highlight the target element (don't change position property)
            element.style.zIndex = '10001';
            element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
            element.style.borderRadius = '8px';
        }
    };

    const clearHighlight = () => {
        steps.forEach(step => {
            const element = document.querySelector(step.target);
            if (element) {
                element.style.boxShadow = '';
                // Don't clear z-index, just reset to original if it had one
                const originalClass = element.className;
                if (originalClass.includes('z-10')) {
                    element.style.zIndex = '10';
                } else {
                    element.style.zIndex = '';
                }
            }
        });
    };

    const handleNext = () => {
        clearHighlight();
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        clearHighlight();
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        clearHighlight();
        handleComplete();
    };

    const handleComplete = () => {
        clearHighlight();
        localStorage.setItem('ereader_tour_completed', 'true');
        onComplete();
    };

    if (currentStep >= steps.length) return null;

    const step = steps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 z-[10000]" onClick={handleSkip} />

            {/* Tour Modal */}
            <div
                className="fixed z-[10002] bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-[calc(100vw-2rem)] sm:max-w-sm transform -translate-x-1/2"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    ...(step.placement === 'top' && { transform: 'translate(-50%, -100%)' }),
                    ...(step.placement === 'bottom' && { transform: 'translate(-50%, 0)' })
                }}
            >
                {/* Arrow */}
                <div
                    className={`absolute w-4 h-4 bg-white transform rotate-45 ${step.placement === 'bottom'
                        ? '-top-2 left-1/2 -translate-x-1/2'
                        : step.placement === 'top'
                            ? '-bottom-2 left-1/2 -translate-x-1/2'
                            : ''
                        }`}
                />

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                        <button
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i className="ri-close-line text-xl"></i>
                        </button>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {/* Progress */}
                    <div className="flex items-center gap-1 mb-4">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-blue-600'
                                    : index < currentStep
                                        ? 'bg-blue-300'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Skip Tour
                        </button>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
