function loadResource(url, resourceType, options = {}) {
    return new Promise((resolve, reject) => {
        const cachedResource = localStorage.getItem(url);
        if (cachedResource) {
            if (resourceType === 'image') {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = cachedResource;
            } else {
                resolve(cachedResource);
            }
        } else {
            fetch(url, {
                headers: options.headers || {},
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch resource');
                    }
                    if (resourceType === 'image') {
                        response.blob().then(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const imageDataUrl = reader.result;
                                const image = new Image();
                                image.onload = () => {
                                    resolve(image);
                                    try {
                                        localStorage.setItem(url, imageDataUrl);
                                    } catch (error) {
                                        console.error('Failed to store image in local storage:', error);
                                    }
                                };
                                image.onerror = reject;
                                image.src = imageDataUrl;
                            };
                            reader.readAsDataURL(blob);
                        });
                    } else {
                        response.text().then(data => {
                            try {
                                const parsedData = JSON.parse(data);
                                if (parsedData.status && parsedData.status.value === 19) {
                                    throw new Error('Request limit exceeded');
                                }
                                localStorage.setItem(url, data);
                                resolve(data);
                            } catch (error) {
                                console.error('Failed to store resource in local storage:', error);
                                reject(error);
                            }
                        });
                    }
                })
                .catch(reject);
        }
    });
}