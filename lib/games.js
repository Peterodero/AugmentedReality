// Games Registry & Helpers for Safaricom AR Activation

/**
 * Fetches current games from /api/games endpoint.
 * Falls back to public/games.json if API fails.
 * Returns empty array if no games configured yet.
 */
export async function fetchGames() {
  try {
    const res = await fetch('/api/games', { cache: 'no-store' });
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    if (data.games && Array.isArray(data.games)) {
      return data.games;
    }
  } catch (err) {
    console.warn('Could not fetch /api/games, falling back to games.json:', err);
    try {
      const res = await fetch('/games.json', { cache: 'no-store' });
      if (res.ok) {
        const games = await res.json();
        if (Array.isArray(games)) return games;
      }
    } catch (e) {
      console.warn('Fallback static fetch also failed:', e);
    }
  }
  // Return empty array — admin must configure games via /event-admin1
  return [];
}

/**
 * Returns a randomly selected game from the provided games array.
 * Avoids returning the previously recommended game if possible.
 * Returns null if the pool is empty.
 */
export function getRandomGame(gamesList = [], previousId = null) {
  if (!gamesList || gamesList.length === 0) return null;
  const availableGames = gamesList.filter(g => g.id !== previousId);
  const pool = availableGames.length > 0 ? availableGames : gamesList;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || null;
}
