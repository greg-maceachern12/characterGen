console.log("JavaScript file loaded");
const goButton = document.querySelector('.go-button');
const inputElement = document.querySelector('.text-input');

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

function callCharacterAPI() {
  console.log("callCharacterAPI function called");
  const inputElement = document.querySelector('.text-input');
  const userPrompt = inputElement.value.trim();
  
  console.log("User input:", userPrompt);

  if (!userPrompt) {
    console.log("Empty prompt, showing alert");
    alert('Please enter a character name');
    return;
  }

  const charPromptUrl = 'https://visuaicalls.azurewebsites.net/api/charPrompt?code=BGZCON6zavJCka4p1lt6zcL1FHfwaER0ZGgpFjKBlwFZAzFucqPe-g%3D%3D';
  const characterSDUrl = 'https://visuaicalls.azurewebsites.net/api/characterSD?code=jwPnjwG8dLAQHtoIrInYsIon6Iy5lN_pyyZgtPnGtzPYAzFuxNvHFQ%3D%3D';

  console.log("Making first API call to:", charPromptUrl);
  loadingState()
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
      img.style.maxWidth = '400px';
      img.style.height = 'auto';
      img.style.marginTop = '20px';
      img.style.borderRadius = '15px';
      
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

// Add event listener to the Go button
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM content loaded, adding event listeners");
  // const goButton = document.querySelector('.go-button');
  // const inputElement = document.querySelector('.text-input');

  if (goButton && inputElement) {
    console.log("Found button and input elements");
    goButton.addEventListener('click', callCharacterAPI);
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        callCharacterAPI();
      }
    });
  } else {
    console.error("Could not find button or input element");
  }
});
