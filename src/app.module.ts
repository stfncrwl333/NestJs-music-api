import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { SingerModule } from './singer/singer.module';
import { SingerAlbumModule } from './singer-album/singer-album.module';
import { SongModule } from './song/song.module';
import { PlaylistModule } from './playlist/playlist.module';
import { UserModule } from './user/user.module';


@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    AuthModule,
    PrismaModule,
    UploadModule,
    SingerModule,
    SingerAlbumModule,
    SongModule,
    PlaylistModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
