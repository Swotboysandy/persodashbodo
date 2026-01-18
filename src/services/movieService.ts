export const searchMovies = async (query: string) => {
    if (!query) return [];
    try {
        const res = await fetch(`/api/movies/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) {
            const error = await res.json();
            console.error('Movie search error:', error);
            return [];
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to search movies:', error);
        return [];
    }
};

export const getMovieDetails = async (movieId: number) => {
    if (!movieId) return null;
    try {
        const res = await fetch(`/api/movies/search?id=${movieId}`);
        if (!res.ok) {
            const error = await res.json();
            console.error('Movie details error:', error);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Failed to fetch movie details:', error);
        return null;
    }
};
