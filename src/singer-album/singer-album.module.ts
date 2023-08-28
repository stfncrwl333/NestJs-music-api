import {Module} from '@nestjs/common';
import {SingerAlbumService} from './singer-album.service';
import {SingerAlbumController} from './singer-album.controller';
import {JwtModule} from '@nestjs/jwt';
import {SongModule} from '../song/song.module';

@Module({
    imports: [JwtModule, SongModule],
    controllers: [SingerAlbumController],
    providers: [SingerAlbumService],
    exports: [SingerAlbumService]
})
export class SingerAlbumModule {}
