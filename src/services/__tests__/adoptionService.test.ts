import { initiateAdoption, finalizeAdoption } from '../adoptionService';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, status: 'NEW' }),
  })
) as jest.Mock;

describe('adoptionService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('initiateAdoption builds correct payload', async () => {
    await initiateAdoption(10, 'user_1', null);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/adoptions/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemon_entity_id: 10, receiver_user_id: 'user_1' }),
    });
  });

  it('finalizeAdoption builds correct payload', async () => {
    await finalizeAdoption(1, null);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/adoptions/1/finalize', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
