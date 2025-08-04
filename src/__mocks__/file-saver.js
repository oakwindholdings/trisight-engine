// src/__mocks__/file-saver.js
// Mock for file-saver library
// Context: Prevents actual file downloads during tests

module.exports = {
  saveAs: jest.fn((blob, filename) => {
    // Mock implementation - just log the save action
    console.log(`Mock saveAs called with filename: ${filename}`);
  })
};