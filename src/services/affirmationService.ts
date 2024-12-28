export interface Affirmation {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

// No need for these functions anymore since we're handling storage in the component
export const getUserAffirmations = async (): Promise<Affirmation[]> => {
  throw new Error('This function is deprecated. Use local storage instead.');
};

export const saveAffirmation = async (
  text: string,
  audioUrl: string,
  duration: number
): Promise<Affirmation> => {
  throw new Error('This function is deprecated. Use local storage instead.');
};

export const deleteAffirmation = async (id: string): Promise<void> => {
  throw new Error('This function is deprecated. Use local storage instead.');
}; 