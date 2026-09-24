// Games Registry & Helpers for Safaricom AR Activation

export const DEFAULT_GAMES = [
  {
    id: 'safaricom-runner',
    title: 'Safaricom Safari Runner 3D',
    description: 'Dodge obstacles, collect M-PESA coins, and race for the high score!',
    category: 'Arcade / Action',
    badge: 'Popular',
    color: '#00A651',
    url: 'https://safaricom-runner.vercel.app'
  },
  {
    id: 'mpesa-spin-win',
    title: 'M-PESA Wheel of Fortune',
    description: 'Spin the lucky wheel for instant prizes and bonus points.',
    category: 'Casual / Luck',
    badge: 'Prize Game',
    color: '#FFD100',
    url: 'https://mpesa-spin-win.vercel.app'
  },
  {
    id: 'safaricom-trivia-dash',
    title: 'Safaricom 5G Trivia Master',
    description: 'Test your tech knowledge in a fast-paced live quiz countdown!',
    category: 'Trivia / Quiz',
    badge: 'Brain Teaser',
    color: '#008741',
    url: 'https://safaricom-trivia.vercel.app'
  }
];

/**
 * Fetches current games from /api/games endpoint.
 * Falls back to public static JSON or DEFAULT_GAMES if API fails.
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
      console.warn('Fallback static fetch failed:', e);
    }
  }
  return DEFAULT_GAMES;
}

/**
 * Returns a randomly selected game from the provided games array (or DEFAULT_GAMES).
 * Avoids returning the previously recommended game if possible.
 */
export function getRandomGame(gamesList = DEFAULT_GAMES, previousId = null) {
  const list = (gamesList && gamesList.length > 0) ? gamesList : DEFAULT_GAMES;
  const availableGames = list.filter(g => g.id !== previousId);
  const pool = availableGames.length > 0 ? availableGames : list;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || list[0];
}
