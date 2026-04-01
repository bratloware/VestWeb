import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockVideoFindAll = jest.fn();
const mockVideoFindByPk = jest.fn();
const mockVideoCreate = jest.fn();
const mockVideoProgressFindOne = jest.fn();
const mockVideoProgressFindOrCreate = jest.fn();
const mockFavoriteFindOne = jest.fn();
const mockFavoriteCreate = jest.fn();
const mockFavoriteFindAll = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Video: {
    findAll: mockVideoFindAll,
    findByPk: mockVideoFindByPk,
    create: mockVideoCreate,
  },
  VideoProgress: {
    findOne: mockVideoProgressFindOne,
    findOrCreate: mockVideoProgressFindOrCreate,
  },
  FavoriteVideo: {
    findOne: mockFavoriteFindOne,
    create: mockFavoriteCreate,
    findAll: mockFavoriteFindAll,
  },
  Topic: {},
  Subject: {},
  Student: {},
}));

const {
  getAll, getById, create, updateProgress, toggleFavorite, getFavorites,
} = await import('../../../src/controllers/videosController.js');

// ── Helper ────────────────────────────────────────────────────────────────────
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const makeVideo = (id = 1, created_by = 2) => ({
  id,
  title: 'Biologia Celular',
  created_by,
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: () => ({ id, title: 'Biologia Celular', created_by }),
});

// ── getAll ─────────────────────────────────────────────────────────────────────
describe('videosController.getAll', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all videos', async () => {
    mockVideoFindAll.mockResolvedValue([makeVideo()]);
    const req = { query: {} };
    const res = makeRes();
    await getAll(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Videos fetched', data: expect.any(Array) });
  });

  it('should filter by topic_id when provided', async () => {
    mockVideoFindAll.mockResolvedValue([]);
    const req = { query: { topic_id: '3' } };
    const res = makeRes();
    await getAll(req, res);
    const [callArgs] = mockVideoFindAll.mock.calls;
    expect(callArgs[0].where.topic_id).toBe('3');
  });
});

// ── getById ────────────────────────────────────────────────────────────────────
describe('videosController.getById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return video with user progress and favorite status', async () => {
    mockVideoFindByPk.mockResolvedValue(makeVideo());
    mockVideoProgressFindOne.mockResolvedValue({ progress_seconds: 120, watched: false });
    mockFavoriteFindOne.mockResolvedValue(null);
    const req = { params: { id: '1' }, user: { id: 7 } };
    const res = makeRes();
    await getById(req, res);
    const data = res.json.mock.calls[0][0].data;
    expect(data.isFavorite).toBe(false);
    expect(data.progress).toBeDefined();
  });

  it('should return isFavorite=true when the video is favorited', async () => {
    mockVideoFindByPk.mockResolvedValue(makeVideo());
    mockVideoProgressFindOne.mockResolvedValue(null);
    mockFavoriteFindOne.mockResolvedValue({ id: 10 });
    const req = { params: { id: '1' }, user: { id: 7 } };
    const res = makeRes();
    await getById(req, res);
    expect(res.json.mock.calls[0][0].data.isFavorite).toBe(true);
  });

  it('should return 404 when video does not exist', async () => {
    mockVideoFindByPk.mockResolvedValue(null);
    const req = { params: { id: '999' }, user: { id: 7 } };
    const res = makeRes();
    await getById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── create ─────────────────────────────────────────────────────────────────────
describe('videosController.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 for a student', async () => {
    const req = { user: { role: 'student' }, body: {} };
    const res = makeRes();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should create a video for a teacher', async () => {
    mockVideoCreate.mockResolvedValue(makeVideo());
    const req = {
      user: { id: 2, role: 'teacher' },
      body: { title: 'Biologia Celular', youtube_url: 'https://youtube.com/xyz', topic_id: 1 },
    };
    const res = makeRes();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Video created', data: expect.any(Object) });
  });
});

// ── updateProgress ─────────────────────────────────────────────────────────────
describe('videosController.updateProgress', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create progress record if it does not exist, then update it', async () => {
    const progressRecord = { watched: false, progress_seconds: 0, update: jest.fn() };
    mockVideoProgressFindOrCreate.mockResolvedValue([progressRecord, true]);
    const req = { params: { id: '1' }, body: { watched: true, progress_seconds: 300 }, user: { id: 7 } };
    const res = makeRes();
    await updateProgress(req, res);
    expect(progressRecord.update).toHaveBeenCalledWith(expect.objectContaining({ watched: true, progress_seconds: 300 }));
    expect(res.json).toHaveBeenCalledWith({ message: 'Progress updated', data: progressRecord });
  });

  it('should preserve existing values for fields not passed in the body', async () => {
    const progressRecord = { watched: true, progress_seconds: 150, update: jest.fn() };
    mockVideoProgressFindOrCreate.mockResolvedValue([progressRecord, false]);
    const req = { params: { id: '1' }, body: { progress_seconds: 200 }, user: { id: 7 } };
    const res = makeRes();
    await updateProgress(req, res);
    // watched is undefined in body, so should keep previous value
    expect(progressRecord.update).toHaveBeenCalledWith(expect.objectContaining({ watched: true }));
  });
});

// ── toggleFavorite ─────────────────────────────────────────────────────────────
describe('videosController.toggleFavorite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should add to favorites when not already favorited', async () => {
    mockFavoriteFindOne.mockResolvedValue(null);
    mockFavoriteCreate.mockResolvedValue({});
    const req = { params: { id: '1' }, user: { id: 7 } };
    const res = makeRes();
    await toggleFavorite(req, res);
    expect(mockFavoriteCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Added to favorites', data: { isFavorite: true } });
  });

  it('should remove from favorites when already favorited', async () => {
    const existing = { destroy: jest.fn() };
    mockFavoriteFindOne.mockResolvedValue(existing);
    const req = { params: { id: '1' }, user: { id: 7 } };
    const res = makeRes();
    await toggleFavorite(req, res);
    expect(existing.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Removed from favorites', data: { isFavorite: false } });
  });
});
