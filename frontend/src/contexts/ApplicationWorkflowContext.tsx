/**
 * Application Workflow Context for managing multi-step form submission.
 * 
 * This context provides state management for the entire application submission
 * workflow, including form data persistence, step navigation, and submission status.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { PersonalInfo, UploadedFile, ApplicationStatus } from '../types';
import { useApplicationWorkflow } from '../hooks/useApplications';
import { CreateApplicationRequest } from '../services/applicationService';

// Workflow steps
export type WorkflowStep = 'personal-info' | 'file-upload' | 'review' | 'confirmation' | 'success';

// Workflow state interface
export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  personalInfo: Partial<PersonalInfo>;
  uploadedFiles: {
    studentId?: UploadedFile;
    passport?: UploadedFile;
  };
  applicationId?: string;
  referenceNumber?: string;
  submissionStatus: 'idle' | 'saving' | 'submitting' | 'submitted' | 'error';
  error?: string;
  isDirty: boolean;
}

// Workflow actions
type WorkflowAction =
  | { type: 'SET_STEP'; payload: WorkflowStep }
  | { type: 'COMPLETE_STEP'; payload: WorkflowStep }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'SET_UPLOADED_FILE'; payload: { type: 'studentId' | 'passport'; file: UploadedFile } }
  | { type: 'REMOVE_UPLOADED_FILE'; payload: 'studentId' | 'passport' }
  | { type: 'SET_APPLICATION_ID'; payload: string }
  | { type: 'SET_REFERENCE_NUMBER'; payload: string }
  | { type: 'SET_SUBMISSION_STATUS'; payload: WorkflowState['submissionStatus'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<WorkflowState> };

// Initial state
const initialState: WorkflowState = {
  currentStep: 'personal-info',
  completedSteps: [],
  personalInfo: {},
  uploadedFiles: {},
  submissionStatus: 'idle',
  isDirty: false,
};

// Workflow reducer
function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload)
          ? state.completedSteps
          : [...state.completedSteps, action.payload],
      };

    case 'UPDATE_PERSONAL_INFO':
      return {
        ...state,
        personalInfo: {
          ...state.personalInfo,
          ...action.payload,
        },
        isDirty: true,
      };

    case 'SET_UPLOADED_FILE':
      return {
        ...state,
        uploadedFiles: {
          ...state.uploadedFiles,
          [action.payload.type]: action.payload.file,
        },
        isDirty: true,
      };

    case 'REMOVE_UPLOADED_FILE':
      const { [action.payload]: removed, ...remainingFiles } = state.uploadedFiles;
      return {
        ...state,
        uploadedFiles: remainingFiles,
        isDirty: true,
      };

    case 'SET_APPLICATION_ID':
      return {
        ...state,
        applicationId: action.payload,
      };

    case 'SET_REFERENCE_NUMBER':
      return {
        ...state,
        referenceNumber: action.payload,
      };

    case 'SET_SUBMISSION_STATUS':
      return {
        ...state,
        submissionStatus: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        submissionStatus: 'error',
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
      };

    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
      };

    case 'RESET_WORKFLOW':
      return {
        ...initialState,
      };

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

// Context interface
interface WorkflowContextType {
  state: WorkflowState;
  
  // Navigation methods
  goToStep: (step: WorkflowStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completeStep: (step: WorkflowStep) => void;
  
  // Data management methods
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  setUploadedFile: (type: 'studentId' | 'passport', file: UploadedFile) => void;
  removeUploadedFile: (type: 'studentId' | 'passport') => void;
  
  // Submission methods
  saveAsDraft: () => Promise<void>;
  submitApplication: () => Promise<void>;
  
  // Utility methods
  canGoToStep: (step: WorkflowStep) => boolean;
  isStepCompleted: (step: WorkflowStep) => boolean;
  getStepProgress: () => number;
  resetWorkflow: () => void;
  clearError: () => void;
}

// Create context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Step order for navigation
const STEP_ORDER: WorkflowStep[] = ['personal-info', 'file-upload', 'review', 'confirmation', 'success'];

// Storage key for persistence
const STORAGE_KEY = 'formvault_workflow_state';

// Context provider component
export function ApplicationWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const applicationWorkflow = useApplicationWorkflow();

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState });
      }
    } catch (error) {
      console.warn('Failed to load workflow state from storage:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const stateToSave = {
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        personalInfo: state.personalInfo,
        uploadedFiles: state.uploadedFiles,
        applicationId: state.applicationId,
        referenceNumber: state.referenceNumber,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save workflow state to storage:', error);
    }
  }, [state]);

  // Navigation methods
  const goToStep = useCallback((step: WorkflowStep) => {
    if (canGoToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      goToStep(nextStep);
    }
  }, [state.currentStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const previousStep = STEP_ORDER[currentIndex - 1];
      goToStep(previousStep);
    }
  }, [state.currentStep, goToStep]);

  const completeStep = useCallback((step: WorkflowStep) => {
    dispatch({ type: 'COMPLETE_STEP', payload: step });
  }, []);

  // Data management methods
  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: info });
  }, []);

  const setUploadedFile = useCallback((type: 'studentId' | 'passport', file: UploadedFile) => {
    dispatch({ type: 'SET_UPLOADED_FILE', payload: { type, file } });
  }, []);

  const removeUploadedFile = useCallback((type: 'studentId' | 'passport') => {
    dispatch({ type: 'REMOVE_UPLOADED_FILE', payload: type });
  }, []);

  // Submission methods
  const saveAsDraft = useCallback(async () => {
    try {
      dispatch({ type: 'SET_SUBMISSION_STATUS', payload: 'saving' });
      dispatch({ type: 'CLEAR_ERROR' });

      const applicationData: CreateApplicationRequest = {
        personal_info: state.personalInfo as PersonalInfo,
        insurance_type: state.personalInfo.insuranceType || 'health',
        preferred_language: 'en', // TODO: Get from i18n context
        student_id_file_id: state.uploadedFiles.studentId?.id,
        passport_file_id: state.uploadedFiles.passport?.id,
      };

      let result;
      if (state.applicationId) {
        // Update existing application
        result = await applicationWorkflow.updateApplication.execute({
          id: state.applicationId,
          data: applicationData,
        });
      } else {
        // Create new application
        await applicationWorkflow.createApplication.execute(applicationData);
        result = applicationWorkflow.createApplication.data;
      }

      if (result) {
        dispatch({ type: 'SET_APPLICATION_ID', payload: result.id });
        dispatch({ type: 'SET_REFERENCE_NUMBER', payload: result.reference_number });
        dispatch({ type: 'SET_DIRTY', payload: false });
      }

      dispatch({ type: 'SET_SUBMISSION_STATUS', payload: 'idle' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save application';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state, applicationWorkflow]);

  const submitApplication = useCallback(async () => {
    try {
      dispatch({ type: 'SET_SUBMISSION_STATUS', payload: 'submitting' });
      dispatch({ type: 'CLEAR_ERROR' });

      // First save as draft if needed
      if (state.isDirty || !state.applicationId) {
        await saveAsDraft();
      }

      if (!state.applicationId) {
        throw new Error('No application ID available for submission');
      }

      // Submit the application
      await applicationWorkflow.submitApplication.execute({
        id: state.applicationId,
        data: { confirm_submission: true },
      });

      dispatch({ type: 'SET_SUBMISSION_STATUS', payload: 'submitted' });
      dispatch({ type: 'SET_STEP', payload: 'success' });
      dispatch({ type: 'COMPLETE_STEP', payload: 'confirmation' });
      dispatch({ type: 'COMPLETE_STEP', payload: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state, applicationWorkflow, saveAsDraft]);

  // Utility methods
  const canGoToStep = useCallback((step: WorkflowStep): boolean => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    
    // Can always go to current or previous steps
    if (stepIndex <= currentIndex) {
      return true;
    }
    
    // Can go to next step if current step is completed
    if (stepIndex === currentIndex + 1) {
      return state.completedSteps.includes(state.currentStep);
    }
    
    // Can't skip steps
    return false;
  }, [state.currentStep, state.completedSteps]);

  const isStepCompleted = useCallback((step: WorkflowStep): boolean => {
    return state.completedSteps.includes(step);
  }, [state.completedSteps]);

  const getStepProgress = useCallback((): number => {
    const totalSteps = STEP_ORDER.length;
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  }, [state.currentStep]);

  const resetWorkflow = useCallback(() => {
    dispatch({ type: 'RESET_WORKFLOW' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: WorkflowContextType = {
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    completeStep,
    updatePersonalInfo,
    setUploadedFile,
    removeUploadedFile,
    saveAsDraft,
    submitApplication,
    canGoToStep,
    isStepCompleted,
    getStepProgress,
    resetWorkflow,
    clearError,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Hook to use the workflow context
export function useApplicationWorkflowContext(): WorkflowContextType {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useApplicationWorkflowContext must be used within an ApplicationWorkflowProvider');
  }
  return context;
}

export default WorkflowContext;