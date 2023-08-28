import {Role} from "@prisma/client";

export class UserResponse {
    id: number;
    username: string;
    email: string;
    photo: string;
    photoName: string;
    role: Role;
    confirmed: Boolean;
    createdAt: Date;
    updatedAt: Date;
}