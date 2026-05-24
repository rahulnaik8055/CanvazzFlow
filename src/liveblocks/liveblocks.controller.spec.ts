import { Test, TestingModule } from '@nestjs/testing';
import { LiveblocksController } from './liveblocks.controller';

describe('LiveblocksController', () => {
  let controller: LiveblocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveblocksController],
    }).compile();

    controller = module.get<LiveblocksController>(LiveblocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
