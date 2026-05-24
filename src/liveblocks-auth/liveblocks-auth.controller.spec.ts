import { Test, TestingModule } from '@nestjs/testing';
import { LiveblocksAuthController } from './liveblocks-auth.controller';

describe('LiveblocksAuthController', () => {
  let controller: LiveblocksAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveblocksAuthController],
    }).compile();

    controller = module.get<LiveblocksAuthController>(LiveblocksAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
