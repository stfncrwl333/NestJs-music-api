import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class RedisService {
  private readonly RedisClient:Redis

  constructor(private readonly config:ConfigService) {
    this.RedisClient = new Redis({
      port: this.config.getOrThrow("REDIS_CACHE_PORT"),
      host: this.config.getOrThrow("REDIS_CACHE_HOST"),
      password:this.config.getOrThrow("REDIS_CACHE_SECRET"),
      username:this.config.getOrThrow("REDIS_CACHE_USERNAME")
    })
  }


  async set(key:string, value:any):Promise<any>{
    return await this.RedisClient.set(key, value)
  }

  async get(key:string):Promise<any>{
    return await this.RedisClient.get(key)
  }
}
