// DOM Element References
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-btn');
const resultsSection = document.getElementById('results-section');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');

// Reliable Free Dictionary API Endpoint Base URL
const API_BASE_URL = 'https://freedictionaryapi.com/api/v1/entries/en/';

// Event Listeners
searchForm.addEventListener('submit', handleSearchSubmit);
searchInput.addEventListener('input', handleInputChange);
clearBtn.addEventListener('click', clearInput);

// Handle input changes to toggle clear button visibility
function handleInputChange() {
    if (searchInput.value.trim().length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
}

// Clear search input and hide results/errors
function clearInput() {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchInput.focus();
}

// Handle form submission
function handleSearchSubmit(e) {
    e.preventDefault();
    const word = searchInput.value.trim();

    if (!word) {
        showError('Empty Search', 'Please enter a valid word before searching.');
        return;
    }

    fetchWordDefinition(word);
}

// Fetch Word Definition from Stable Dictionary API
async function fetchWordDefinition(word) {
    showLoadingState();

    try {
        const response = await fetch(`${API_BASE_URL}${encodeURIComponent(word.toLowerCase())}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Word not found in the dictionary. Please check your spelling or try another word.');
            } else {
                throw new Error('An unexpected error occurred. Please try again later.');
            }
        }

        const data = await response.json();
        
        if (!data || !data.entries || data.entries.length === 0) {
            throw new Error('Word not found in the dictionary.');
        }

        displayWordData(data);
    } catch (error) {
        showError('Search Failed', error.message);
    }
}

// UI State Management Functions
function showLoadingState() {
    resultsSection.classList.add('hidden');
    errorContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
}

function showError(title, message) {
    loadingSpinner.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Parse and Display Word Data in the DOM
function displayWordData(data) {
    loadingSpinner.classList.add('hidden');
    errorContainer.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Extract phonetic text if available
    let phoneticText = '';
    if (data.entries[0].pronunciations && data.entries[0].pronunciations.length > 0) {
        phoneticText = data.entries[0].pronunciations[0].text || '';
    }

    // Build Word Header HTML
    let html = `
        <div class="word-header">
            <div class="word-title">
                <h2>${escapeHTML(data.word)}</h2>
                ${phoneticText ? `<p class="phonetic-text">${escapeHTML(phoneticText)}</p>` : ''}
            </div>
        </div>
    `;

    // Build Meanings Sections from entries
    if (data.entries && data.entries.length > 0) {
        data.entries.forEach(entry => {
            html += `
                <div class="meaning-group">
                    <h3 class="part-of-speech">${escapeHTML(entry.partOfSpeech || 'definition')}</h3>
                    <ul class="definitions-list">
            `;

            if (entry.senses && entry.senses.length > 0) {
                entry.senses.forEach(sense => {
                    const exampleText = sense.examples && sense.examples.length > 0 ? sense.examples[0] : '';
                    html += `
                        <li class="definition-item">
                            <p class="definition-text">${escapeHTML(sense.definition)}</p>
                            ${exampleText ? `<p class="example-text">"${escapeHTML(exampleText)}"</p>` : ''}
                        </li>
                    `;
                });
            }

            html += `</ul>`;

            // Extract and display synonyms if present across senses
            let allSynonyms = [];
            if (entry.senses) {
                entry.senses.forEach(sense => {
                    if (sense.synonyms) allSynonyms = allSynonyms.concat(sense.synonyms);
                });
            }

            if (allSynonyms.length > 0) {
                const uniqueSynonyms = [...new Set(allSynonyms)].slice(0, 5);
                html += `
                    <div class="synonyms-container">
                        <span class="synonyms-label">Synonyms:</span>
                        ${uniqueSynonyms.map(syn => `<span class="synonym-tag" onclick="searchSynonym('${escapeHTML(syn)}')">${escapeHTML(syn)}</span>`).join('')}
                    </div>
                `;
            }

            html += `</div>`;
        });
    }

    resultsSection.innerHTML = html;
}

// Function to trigger search when clicking on a synonym tag
window.searchSynonym = function(synonymWord) {
    searchInput.value = synonymWord;
    handleInputChange();
    fetchWordDefinition(synonymWord);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Utility function to prevent XSS vulnerability
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}