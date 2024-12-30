import AsyncStorage from '@react-native-async-storage/async-storage';
import { MentorBoard, MentorImage, WikimediaSearchResult } from '../types/mentorBoard';

const STORAGE_KEYS = {
  MENTOR_BOARDS: 'mentor_boards',
};

export const searchWikimediaImages = async (query: string): Promise<WikimediaSearchResult[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&` +
      `format=json&` +
      `prop=imageinfo&` +
      `generator=search&` +
      `gsrsearch=File:${encodedQuery}&` +
      `gsrlimit=20&` +
      `iiprop=url&` +
      `origin=*`;

    console.log('Making Wikimedia API request:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Wikimedia API response:', JSON.stringify(data, null, 2));

    if (!data.query || !data.query.pages) {
      console.log('No results found');
      return [];
    }

    console.log('Processing results...');
    const results = Object.values(data.query.pages).map((page: any) => {
      console.log('Processing page:', page);
      const imageUrl = page.imageinfo?.[0]?.url;
      return {
        pageid: page.pageid,
        title: page.title,
        thumbnail: imageUrl ? {
          source: imageUrl,
          width: 300,
          height: 300,
        } : undefined,
        originalimage: imageUrl ? {
          source: imageUrl,
          width: 800,
          height: 800,
        } : undefined,
        description: page.title.replace('File:', '').split('.')[0],
      };
    });

    const filteredResults = results.filter(result => result.thumbnail?.source && result.originalimage?.source);
    console.log(`Found ${filteredResults.length} valid results after filtering`);
    return filteredResults;
  } catch (error) {
    console.error('Error searching Wikimedia images:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const loadMentorBoards = async (): Promise<MentorBoard[]> => {
  try {
    console.log('Loading mentor boards from storage...');
    const storedBoards = await AsyncStorage.getItem(STORAGE_KEYS.MENTOR_BOARDS);
    console.log('Raw stored boards:', storedBoards);
    if (storedBoards) {
      const boards = JSON.parse(storedBoards);
      console.log('Parsed boards:', boards);
      return boards;
    }
    return [];
  } catch (error) {
    console.error('Error loading mentor boards:', error);
    return [];
  }
};

export const saveMentorBoard = async (board: MentorBoard): Promise<void> => {
  try {
    console.log('Saving board:', board);
    const boards = await loadMentorBoards();
    const existingIndex = boards.findIndex(b => b.id === board.id);
    
    if (existingIndex >= 0) {
      boards[existingIndex] = board;
    } else {
      boards.push(board);
    }
    
    console.log('Saving boards to storage:', boards);
    await AsyncStorage.setItem(STORAGE_KEYS.MENTOR_BOARDS, JSON.stringify(boards));
    console.log('Boards saved successfully');
  } catch (error) {
    console.error('Error saving mentor board:', error);
    throw error;
  }
};

export const deleteMentorBoard = async (boardId: string): Promise<void> => {
  try {
    const boards = await loadMentorBoards();
    const updatedBoards = boards.filter(board => board.id !== boardId);
    await AsyncStorage.setItem(STORAGE_KEYS.MENTOR_BOARDS, JSON.stringify(updatedBoards));
  } catch (error) {
    console.error('Error deleting mentor board:', error);
    throw error;
  }
};

export const addMentorToBoard = async (boardId: string, mentor: MentorImage): Promise<void> => {
  try {
    const boards = await loadMentorBoards();
    const board = boards.find(b => b.id === boardId);
    
    if (!board) {
      throw new Error('Board not found');
    }
    
    if (board.mentors.length >= 12) {
      throw new Error('Maximum number of mentors reached');
    }
    
    board.mentors.push(mentor);
    await saveMentorBoard(board);
  } catch (error) {
    console.error('Error adding mentor to board:', error);
    throw error;
  }
};

export const removeMentorFromBoard = async (boardId: string, mentorId: string): Promise<void> => {
  try {
    const boards = await loadMentorBoards();
    const board = boards.find(b => b.id === boardId);
    
    if (!board) {
      throw new Error('Board not found');
    }
    
    board.mentors = board.mentors.filter(mentor => mentor.id !== mentorId);
    await saveMentorBoard(board);
  } catch (error) {
    console.error('Error removing mentor from board:', error);
    throw error;
  }
}; 