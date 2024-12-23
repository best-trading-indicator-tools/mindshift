import { OPENAI_API_KEY } from '@env';

// Validate environment variables
const validateEnv = () => {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not defined in .env file');
    return false;
  }
  
  if (!OPENAI_API_KEY.startsWith('sk-')) {
    console.error('OPENAI_API_KEY appears to be invalid (should start with sk-)');
    return false;
  }
  
  return true;
};

export const config = {
  OPENAI_API_KEY,
  isValid: validateEnv(),
};
