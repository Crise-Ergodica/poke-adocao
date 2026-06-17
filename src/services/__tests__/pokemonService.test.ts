import { spawnPokemon, getNearby } from '../pokemonService';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('pokemonService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('spawnPokemon builds correct payload', async () => {
    await spawnPokemon(40.0, -73.0, 'dummy_token');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/map/spawn?latitude=40&longitude=-73', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dummy_token' },
    });
  });

  it('getNearby builds correct URL', async () => {
    await getNearby(40.0, -73.0);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/map/nearby?latitude=40&longitude=-73', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
