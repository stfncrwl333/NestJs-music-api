import {Module} from '@nestjs/common';
import {SingerService} from './singer.service';
import {SingerController} from './singer.controller';
import {JwtModule} from '@nestjs/jwt';
import {SingerAlbumModule} from "../singer-album/singer-album.module";

@Module({
    imports: [JwtModule.register({}), SingerAlbumModule],
    controllers: [SingerController],
    providers: [SingerService],
})
export class SingerModule {}
