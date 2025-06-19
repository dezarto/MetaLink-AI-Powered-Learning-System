using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IGameService
    {
        Task SaveGameProgressAsync(int studentId, int gameId, string progressData);
        Task<string> GetGameProgressAsync(int studentId, int gameId);

        Task<Game> GetByIdAsync(int id);
        Task<List<Game>> GetAllAsync();
        Task AddAsync(Game game);
        Task UpdateAsync(Game game);
        Task DeleteAsync(int id);
    }
}
