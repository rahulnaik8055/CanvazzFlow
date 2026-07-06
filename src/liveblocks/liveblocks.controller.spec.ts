import { Test, TestingModule } from '@nestjs/testing';
import { LiveblocksController } from './liveblocks.controller';
import { LiveblocksService } from './liveblocks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LiveblocksController', () => {
  let controller: LiveblocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveblocksController],
      providers: [
        LiveblocksService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LiveblocksController>(LiveblocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
