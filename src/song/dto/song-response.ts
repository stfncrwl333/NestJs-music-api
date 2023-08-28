import {SongType} from '@prisma/client';

export class SongResponse {
    id: number;
    name: string;
    description: string;
    artist: string;
    type: SongType;
    language: string;
    rate: number;
    photoName: string;
    createdAt: Date;
    updatedAt: Date;
}
