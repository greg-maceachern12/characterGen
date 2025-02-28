console.log("JavaScript file loaded");
const goButton = document.querySelector('.go-button');
const inputElement = document.querySelector('.text-input');

// Throttling configuration
const THROTTLE_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_REQUESTS = 5; // Maximum 5 requests per window
const THROTTLE_STORAGE_KEY = 'ghola_request_timestamps';

function loadingState() {
  document.getElementById('loading-spinner').classList.add('show');
  goButton.disabled = true;
  inputElement.disabled = true;
}

function removeLoadingState() {
  document.getElementById('loading-spinner').classList.remove('show');
  goButton.disabled = false;
  inputElement.disabled = false;
}

// Get all request timestamps from localStorage
function getRequestTimestamps() {
  try {
    const storedData = localStorage.getItem(THROTTLE_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    localStorage.removeItem(THROTTLE_STORAGE_KEY);
    return [];
  }
}

// Save timestamps to localStorage
function saveRequestTimestamps(timestamps) {
  try {
    localStorage.setItem(THROTTLE_STORAGE_KEY, JSON.stringify(timestamps));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

// Get recent requests within the throttle window
function getRecentRequests() {
  const now = Date.now();
  const cutoffTime = now - THROTTLE_WINDOW;
  const allTimestamps = getRequestTimestamps();
  
  // Filter to only include timestamps within the window
  return allTimestamps.filter(timestamp => timestamp > cutoffTime);
}

// Add a new request timestamp
function recordRequest() {
  const now = Date.now();
  const recentRequests = getRecentRequests();
  recentRequests.push(now);
  saveRequestTimestamps(recentRequests);
  updateRequestsCounter();
}

// Check if the user is currently throttled
function checkThrottle() {
  const recentRequests = getRecentRequests();
  
  if (recentRequests.length < MAX_REQUESTS) {
    return {
      throttled: false,
      remaining: MAX_REQUESTS - recentRequests.length
    };
  }
  
  // If at or over limit, calculate time until oldest request expires
  const now = Date.now();
  recentRequests.sort((a, b) => a - b);
  const oldestRequest = recentRequests[0];
  const resetTime = Math.ceil((oldestRequest + THROTTLE_WINDOW - now) / 1000);
  
  return {
    throttled: true,
    resetTime: resetTime > 0 ? resetTime : 1
  };
}

// Create or update the requests counter in the UI
function updateRequestsCounter() {
  // Remove existing counter if present
  const existingCounter = document.querySelector('.requests-counter');
  if (existingCounter) {
    existingCounter.remove();
  }
  
  const throttleCheck = checkThrottle();
  const usedRequests = throttleCheck.throttled ? MAX_REQUESTS : (MAX_REQUESTS - throttleCheck.remaining);
  
  const counterContainer = document.createElement('div');
  counterContainer.className = 'requests-counter';
  counterContainer.textContent = `${usedRequests}/${MAX_REQUESTS}`;
  
  // Style the counter
  counterContainer.style.position = 'absolute';
  counterContainer.style.top = '10px';
  counterContainer.style.right = '10px';
  counterContainer.style.padding = '5px 10px';
  counterContainer.style.borderRadius = '4px';
  counterContainer.style.fontSize = '14px';
  counterContainer.style.fontWeight = 'bold';
  counterContainer.style.zIndex = '1000';
  counterContainer.style.backgroundColor = throttleCheck.throttled ? 
    'rgba(220, 38, 38, 0.7)' : // Red when throttled
    (usedRequests >= 4 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 0, 0, 0.5)'); // Yellow when close, black otherwise
  counterContainer.style.color = 'white';
  
  document.querySelector('.hero').appendChild(counterContainer);
}

function callCharacterAPI() {
  console.log("callCharacterAPI function called");
  const userPrompt = inputElement.value.trim();
  
  console.log("User input:", userPrompt);

  if (!userPrompt) {
    console.log("Empty prompt, showing alert");
    alert('Please enter a character name');
    return;
  }

  // Check throttling before making API call
  const throttleCheck = checkThrottle();
  if (throttleCheck.throttled) {
    console.log("Request throttled, remaining seconds:", throttleCheck.resetTime);
    alert(`Rate limit exceeded. You've reached the limit of ${MAX_REQUESTS} requests per 5 minutes. Please try again later.`);
    return;
  }

  // Record this request
  recordRequest();
  
  const charPromptUrl = 'https://visuaicalls.azurewebsites.net/api/charPrompt?code=BGZCON6zavJCka4p1lt6zcL1FHfwaER0ZGgpFjKBlwFZAzFucqPe-g%3D%3D';
  const characterSDUrl = 'https://visuaicalls.azurewebsites.net/api/characterSD?code=jwPnjwG8dLAQHtoIrInYsIon6Iy5lN_pyyZgtPnGtzPYAzFuxNvHFQ%3D%3D';

  console.log("Making first API call to:", charPromptUrl);
  loadingState();
  
  // First API call
  fetch(charPromptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: userPrompt }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('First API call was not successful');
    }
    return response.json();
  })
  .then(data => {
    console.log('First API Response:', data.response);
    if (data.response) {
      // Second API call
      console.log("Making second API call to:", characterSDUrl);
      return fetch(characterSDUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: data.response
        }),
      });
    } else {
      throw new Error('No enhanced prompt in the first API response');
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Second API call was not successful');
    }
    return response.json();
  })
  .then(data => {
    console.log('Second API Response:', data);
    if (data.result) {
      // Create and display the image
      const img = document.createElement('img');
      img.src = data.result;
      img.alt = `Generated image of ${userPrompt}`;
      img.style.maxWidth = '350px';
      img.style.height = 'auto';
      img.style.marginTop = '20px';
      img.style.borderRadius = '10px';
      
      const imgContainer = document.createElement('div');
      imgContainer.style.textAlign = 'center';
      imgContainer.appendChild(img);
      
      const inputContainer = document.querySelector('.loading-spinner');
      
      const existingImgContainer = document.querySelector('.generated-image-container');
      if (existingImgContainer) {
        existingImgContainer.remove();
      }
      
      imgContainer.classList.add('generated-image-container');
      
      inputContainer.parentNode.insertBefore(imgContainer, inputContainer.nextSibling);
    } else {
      throw new Error('No image data in the second API response');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while processing your request. Please try again.');
  })
  .finally(() => {
    removeLoadingState();  // Hide loading spinner
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM content loaded");
  
  if (goButton && inputElement) {
    console.log("Found button and input elements");
    goButton.addEventListener('click', callCharacterAPI);
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        callCharacterAPI();
      }
    });
    
    // Clean up expired requests and update the counter
    const recentRequests = getRecentRequests();
    saveRequestTimestamps(recentRequests);
    updateRequestsCounter();
    
    // Update counter periodically to reflect expiring timestamps
    setInterval(() => {
      updateRequestsCounter();
    }, 30 * 1000);
  } else {
    console.error("Could not find button or input element");
  }
});