export interface MentorImage {
  id: string;
  url: string;
  caption?: string;
  name: string;
  description?: string;
  source: string;
  sourceUrl: string;
}

export interface MentorBoard {
  id: string;
  name: string;
  description?: string;
  mentors: MentorImage[];
  createdAt: string;
}

export interface WikimediaSearchResult {
  pageid: number;
  title: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  description?: string;
  extract?: string;
} 