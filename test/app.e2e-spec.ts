import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Role, SingerType, SongType } from '@prisma/client';
import * as cookieParser from 'cookie-parser';
import * as process from 'process';
import * as request from 'supertest';

interface UserData {
  userId: number;
  singerId: number;
  singerAlbumId: number;
  songId: number;
  playlistId: number;
  username: string;
  email: string;
  password: string;
  singerName: string;
  singerInfo: string;
  singerType: string;
  accessToken: string;
  refreshToken: string;
  productKey: string;
}

export const mockUserData: UserData = {
  userId: 0,
  singerId: 0,
  singerAlbumId: 0,
  songId: 0,
  playlistId: 0,
  username: '',
  email: '',
  password: '',
  singerName: '',
  singerInfo: '',
  singerType: '',
  accessToken: '',
  refreshToken: '',
  productKey: process.env.PRODUCT_KEY_STRING,
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  beforeEach(async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });
  const splitToken = (token: string) => {
    const splitted: string = token.split(';')[0];
    const tokenString: string = splitted.split('=')[1];
    return tokenString;
  };
  const setCookie = (response: request.Response): void => {
    const cookies = response.headers['set-cookie'];
    mockUserData.accessToken = cookies[0];
    mockUserData.refreshToken = cookies[1];
  };
  it('/ (GET ROOT)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/auth/signup/ADMIN (SIGNUP-ADMIN)', async (): Promise<void> => {
    const response: request.Response = await request(app.getHttpServer())
      .post('/auth/signup/ADMIN')
      .expect(201)
      .send({
        username: 'stefan crowley',
        email: 'stfncrwl000@gmail.com',
        password: 'stefan123@ME',
        productKey: mockUserData.productKey,
      });
    mockUserData.userId = response.body.id;
    mockUserData.username = response.body.username;
    mockUserData.email = response.body.email;
    mockUserData.password = response.body.password;
    setCookie(response);
  });

  it('/auth/confirm/:token (CONFIRM-EMAIL)', async (): Promise<void> => {
    const token: string = splitToken(mockUserData.accessToken);
    await request(app.getHttpServer())
      .post(`/auth/confirm/${token}`)
      .set('cookie', mockUserData.accessToken)
      .expect(201);
  });

  it('/auth/refresh-token (REFRESH-TOKEN)', async (): Promise<void> => {
    const response: request.Response = await request(app.getHttpServer())
      .get('/auth/refresh-token')
      .set('cookie', mockUserData.refreshToken)
      .expect(200);
    setCookie(response);
  });

  it('/auth/product-key (SIGN-PRODUCT-KEY)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .post('/auth/product-key')
      .send({ email: mockUserData.email, role: Role.ADMIN })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
  });

  it('auth/resend-confirmation (RESEND-CONFIRMATION-EMAIL)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .post('/auth/resend-confirmation')
      .set('cookie', mockUserData.accessToken)
      .expect(201);
  });

  it('auth/forgot-password (FORGOT-PASSWORD)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: mockUserData.email })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
  });

  it('auth/reset-password/:id (RESET-PASSWORD)', async (): Promise<void> => {
    const token: string = splitToken(mockUserData.accessToken);
    await request(app.getHttpServer())
      .put(`/auth/reset-password/${token}`)
      .send({ password: 'stefan123@ME' })
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singers?page=0&size=1 (GET-SINGERS)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .get('/singers?page=0&size=1')
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singers (CREATE-SINGER)', async (): Promise<void> => {
    const response: request.Response = await request(app.getHttpServer())
      .post('/singers')
      .send({
        name: 'stefan crowley singer',
        info: 'stefan crowley info',
        type: SingerType.SINGLE,
      })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
    mockUserData.singerId = response.body.id;
  });

  it('/singers/:id (GET-SINGER)', () => {
    return request(app.getHttpServer())
      .get(`/singers/${mockUserData.singerId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singers/:id (UPDATE-SINGER)', () => {
    return request(app.getHttpServer())
      .put(`/singers/${mockUserData.singerId}`)
      .send({
        name: 'stefan crowley singer updated',
        info: 'stefan crowley info updated',
      })
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singers/:id/singer-albums (CREATE-SINGER-ALBUM)', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .post(`/singers/${mockUserData.singerId}/singer-albums`)
      .send({
        name: 'stefan crowley singer album',
      })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
    mockUserData.singerAlbumId = response.body.id;
  });

  it('/singer-albums?page=0&size=1 (GET-SINGER-ALBUMS)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .get('/singer-albums?page=0&size=1')
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singer-albums/:id (GET-SINGER-ALBUM)', () => {
    return request(app.getHttpServer())
      .get(`/singer-albums/${mockUserData.singerAlbumId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singer-albums/:id (UPDATE-SINGER-ALBUM)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .put(`/singer-albums/${mockUserData.singerAlbumId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/singer-albums/:id/songs (CREATE-SONG)', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .post(`/singer-albums/${mockUserData.singerAlbumId}/songs`)
      .send({
        name: 'stefan crowley song',
        description: 'stefan crowley description',
        artist: 'stefan crowley',
        type: SongType.POP,
        language: 'english',
        rate: 5,
      })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
    mockUserData.songId = response.body.id;
  });

  it('/songs?page=0&size=1 (GET-SONGS)', () => {
    return request(app.getHttpServer())
      .get('/songs?page=0&size=1')
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/songs/:id (GET-SONG)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .get(`/songs/${mockUserData.songId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/songs/:id (UPDATE-SONG)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .put(`/songs/${mockUserData.songId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/playlists?page=0&size=1 (GET-PLAYLISTS)', () => {
    return request(app.getHttpServer())
      .get('/playlists?page=0&size=1')
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/playlists/ (CREATE-PLAYLIST)', async (): Promise<void> => {
    const response: request.Response = await request(app.getHttpServer())
      .post('/playlists')
      .send({
        name: 'stefan crowley playlist',
      })
      .set('cookie', mockUserData.accessToken)
      .expect(201);
    mockUserData.playlistId = response.body.id;
  });

  it('/playlists (GET-PLAYLIST)', () => {
    return request(app.getHttpServer())
      .get(`/playlists/${mockUserData.playlistId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/playlists/:id (UPDATE-PLAYLIST)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .put(`/playlists/${mockUserData.playlistId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/songs/:id/playlists/:id (PUSH-SONG-TO-PLAYLIST)', () => {
    return request(app.getHttpServer())
      .post(
        `/songs/${mockUserData.songId}/playlists/${mockUserData.playlistId}`,
      )
      .set('cookie', mockUserData.accessToken)
      .expect(201);
  });

  it('/users?page=0&size=1 (GET-USERS)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .get('/users?page=0&size=1')
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/users/:id (GET-USER)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .get(`/users/${mockUserData.userId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/users/:id (UPDATE-USER)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .put(`/users/${mockUserData.userId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(200);
  });

  it('/users/:id (DELETE-PLAYLIST)', () => {
    return request(app.getHttpServer())
      .delete(`/playlists/${mockUserData.playlistId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(204);
  });

  it('/songs/:id (DELETE-SONG)', () => {
    return request(app.getHttpServer())
      .delete(`/songs/${mockUserData.songId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(204);
  });

  it('/singer-albums/:id (DELETE-SINGER-ALBUM)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .delete(`/singer-albums/${mockUserData.singerAlbumId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(204);
  });

  it('/singers/:id (DELETE-SINGER)', () => {
    return request(app.getHttpServer())
      .delete(`/singers/${mockUserData.singerId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(204);
  });

  it('/users/:id (DELETE-USER)', async (): Promise<void> => {
    await request(app.getHttpServer())
      .delete(`/users/${mockUserData.userId}`)
      .set('cookie', mockUserData.accessToken)
      .expect(204);
  });
});
