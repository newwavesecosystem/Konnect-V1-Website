/**
 * MK-004-DEV-001 Shared Frontend Submission Service (`src/services/leads.js`)
 * Re-exports the standardized `submitLead` contract and helpers from `leadService.js`.
 */

export {
  submitLead,
  submitLeadToBackend,
  captureUtmParameters,
  createSubmissionAttemptId,
  validateClientLeadForm,
} from './leadService';
