window.VALID_WORDS_BY_LENGTH = {};
window.WORDS_LOADED = false;

async function loadWords() {
  try {
    const response = await fetch('valid_words_by_length.json');
    if (!response.ok) throw new Error('Failed to load word list');

    const wordData = await response.json();

    // Convert all words to uppercase for consistent checks (optional)
    for (const length in wordData) {
      wordData[length] = wordData[length].map(word => word.toUpperCase());
    }

    window.VALID_WORDS_BY_LENGTH = wordData;
    window.WORDS_LOADED = true;
    console.log('Words loaded:', window.VALID_WORDS_BY_LENGTH);
  } catch (error) {
    console.error('Error loading words:', error);
  }
}
