import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (_data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
