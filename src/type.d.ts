import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";

export interface Albums {
    [name: string]: string[];
}

export interface Playlist {
    id: number;
    name: string;
    playlistCover?: Blob;
    createTime: number;
    updateTime: number;
    playTime: number;
    songIds: string[];
}

export interface Song {
    id: string;
    filePath: string;
    songName: string;
    songArtists: string;
    songAlbum: string;
    cover: Blob;
    cachedThumbnail?: Blob;
    duration: number;
    lyricFormat: string;
    lyric: string;
    translatedLrc?: string;
    romanLrc?: string;
}

export interface TTMLDBLyricEntry {
    name: string;
    content: TTMLLyric;
    raw: string;
}
