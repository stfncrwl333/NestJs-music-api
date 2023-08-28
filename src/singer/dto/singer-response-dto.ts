import {SingerType} from "@prisma/client";


export class SingerResponse {
    id:number;
    name:string;
    info:string;
    type:SingerType;
    photoName:string;
    createdAt:Date;
    updatedAt:Date;
}