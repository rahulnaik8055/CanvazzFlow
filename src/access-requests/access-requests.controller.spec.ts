import { Test, TestingModule } from '@nestjs/testing';
import { AccessRequestsController } from './access-requests.controller';

describe('AccessRequestsController', () => {
  let controller: AccessRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessRequestsController],
    }).compile();

    controller = module.get<AccessRequestsController>(AccessRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
