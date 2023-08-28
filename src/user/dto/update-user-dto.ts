import {CreateSignupDto} from "../../auth/dto/create-signup-dto";
import {PartialType} from "@nestjs/mapped-types";


export class UpdateUserDto extends PartialType(CreateSignupDto) {}
