export interface WordCount {
    word: string;
    count: number;
}

export interface PostCount {
    name: string;
    postCount: number;
    topWords: WordCount[];
}