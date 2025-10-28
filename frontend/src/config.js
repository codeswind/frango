// ============================================
// FRONTEND CONFIGURATION
// ============================================
// Configuration is now loaded from .env file for better security
// See .env.example for available variables

// API Configuration - Loaded from environment variables
// Vite exposes env variables via import.meta.env
// All custom variables must be prefixed with VITE_

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/Afkar New/api';
export const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || 'http://localhost/Afkar New';

// Note: Fallback values are provided for development
// In production, always use .env file
