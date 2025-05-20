import { STORAGE_KEYS } from '../api/patternApi';
import { PatternFeedback, LearningModelState } from '../models/FeedbackTypes';

// Interface for exported data package
export interface ExportPackage {
  version: string;
  exportDate: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: {
    feedback: PatternFeedback[];
    learningModel: LearningModelState;
  };
}

/**
 * Get the date range of feedback data
 */
export const getFeedbackDateRange = (feedback: PatternFeedback[]): { startDate: Date; endDate: Date } => {
  if (!feedback || feedback.length === 0) {
    const now = new Date();
    return { startDate: now, endDate: now };
  }

  const dates = feedback.map(f => new Date(f.submittedAt));
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  return { startDate, endDate };
};

/**
 * Create a filename with date range for the export
 */
export const createExportFilename = (startDate: Date, endDate: Date): string => {
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return `trisight-training-data_${formatDate(startDate)}_to_${formatDate(endDate)}.json`;
};

/**
 * Export all relevant training data to a JSON file
 */
export const exportTrainingData = (): void => {
  try {
    // Get all relevant data from localStorage
    const feedbackData = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const learningModelData = localStorage.getItem(STORAGE_KEYS.LEARNING_MODEL);
    
    // Parse the data
    const feedback: PatternFeedback[] = feedbackData ? JSON.parse(feedbackData) : [];
    const learningModel: LearningModelState = learningModelData ? JSON.parse(learningModelData) : null;
    
    // If no data, warn the user
    if (feedback.length === 0 && !learningModel) {
      alert('No training data found to export');
      return;
    }
    
    // Create a package with metadata
    const { startDate, endDate } = getFeedbackDateRange(feedback);
    const exportPackage: ExportPackage = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      data: {
        feedback,
        learningModel,
      },
    };
    
    // Convert to JSON string
    const exportString = JSON.stringify(exportPackage, null, 2);
    
    // Create a downloadable blob
    const blob = new Blob([exportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element to download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = createExportFilename(startDate, endDate);
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('Error exporting training data:', error);
    alert('Failed to export training data. See console for details.');
  }
};

/**
 * Import training data from a JSON file
 */
export const importTrainingData = async (file: File): Promise<boolean> => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          // Parse the imported data
          const importString = event.target?.result as string;
          const importPackage: ExportPackage = JSON.parse(importString);
          
          // Validate the imported data
          if (!importPackage.version || !importPackage.data) {
            throw new Error('Invalid import file format');
          }
          
          // Confirm before overwriting existing data
          if (localStorage.getItem(STORAGE_KEYS.FEEDBACK) || localStorage.getItem(STORAGE_KEYS.LEARNING_MODEL)) {
            const confirmed = window.confirm(
              'This will overwrite existing training data. Are you sure you want to continue?'
            );
            
            if (!confirmed) {
              resolve(false);
              return;
            }
          }
          
          // Store the imported data
          if (importPackage.data.feedback) {
            localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(importPackage.data.feedback));
          }
          
          if (importPackage.data.learningModel) {
            localStorage.setItem(STORAGE_KEYS.LEARNING_MODEL, JSON.stringify(importPackage.data.learningModel));
          }
          
          alert('Training data imported successfully');
          resolve(true);
        } catch (error) {
          console.error('Error processing import file:', error);
          alert('Failed to import training data. Invalid file format.');
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading import file:', error);
        alert('Failed to read import file');
        reject(error);
      };
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Error importing training data:', error);
    alert('Failed to import training data. See console for details.');
    return false;
  }
};
