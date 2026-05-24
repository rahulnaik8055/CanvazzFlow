import { Test, TestingModule } from '@nestjs/testing';
import { AccessRequestsService } from './access-requests.service';

describe('AccessRequestsService', () => {
  let service: AccessRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessRequestsService],
    }).compile();

    service = module.get<AccessRequestsService>(AccessRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
