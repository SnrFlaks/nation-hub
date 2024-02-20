function loadImage(url) {
  return new Promise((resolve, reject) => {
    const cachedImage = localStorage.getItem(url);
    if (cachedImage) {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = cachedImage;
    } else {
      fetchImage(url)
        .then(imageDataUrl => {
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
        })
        .catch(error => {
          console.error('Error loading image:', error);
          reject(error);
        });
    }
  });
}

async function fetchImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        resolve(imageDataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

function fetchResource(url, options = {}) {
  return new Promise((resolve, reject) => {
    const cachedResource = localStorage.getItem(url);
    if (cachedResource) {
      resolve(cachedResource);
    } else {
      fetch(url, {
        headers: options.headers || {},
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch resource');
          }
          return response.text();
        })
        .then(data => {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.status && parsedData.status.value ===   19) {
              throw new Error('Request limit exceeded');
            }
            localStorage.setItem(url, data);
            resolve(data);
          } catch (error) {
            console.error('Failed to store resource in local storage:', error);
            reject(error);
          }
        })
        .catch(error => {
          console.error('Error fetching resource:', error);
          reject(error);
        });
    }
  });
}